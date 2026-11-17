import argparse
import ftplib
import glob
import hashlib
import netrc
import os
import posixpath
import ssl
import sys
import time

HOST = 'user896926.web-3.cloud4box.ru'
CERT_SHA256 = 'a3d7b25ace7de5d8dabdb92e33a970739552748ef5d150bdd75a6f3967b12dde'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_DIR = 'www/pennygachi.men'

TREES = [
    ('web98-card', ''),
    ('web98-site/sr98', 'sr98'),
    ('web98-site/sr98wiki', 'sr98wiki'),
    ('web98-site/kovcheg', 'kovcheg'),
]
ZIP_REMOTE = 'files/Win98.zip'
SKIP_NAMES = {'.DS_Store', 'Thumbs.db', 'desktop.ini'}


def connect():
    auth = netrc.netrc().authenticators(HOST)
    if not auth:
        sys.exit('No entry for ' + HOST + ' in ~/.netrc')
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    ftp = ftplib.FTP_TLS(HOST, timeout=60, context=context)
    ftp.auth()
    if hashlib.sha256(ftp.sock.getpeercert(binary_form=True)).hexdigest() != CERT_SHA256:
        sys.exit('FTP certificate of ' + HOST + ' changed; check it before sending the password')
    ftp.login(auth[0], auth[2])
    ftp.prot_p()
    ftp.encoding = 'utf-8'
    return ftp


def remote_listing(ftp, path):
    try:
        return {name: facts for name, facts in ftp.mlsd(path or '.', facts=['type', 'size', 'modify'])
                if name not in ('.', '..')}
    except ftplib.error_perm:
        return None


def ensure_dir(ftp, path, known):
    if not path or path in known:
        return
    ensure_dir(ftp, posixpath.dirname(path), known)
    try:
        ftp.mkd(path)
    except ftplib.error_perm:
        pass
    known.add(path)


def stamp(ftp, path, mtime):
    try:
        ftp.sendcmd('MFMT ' + time.strftime('%Y%m%d%H%M%S', time.gmtime(int(mtime))) + ' ' + path)
    except ftplib.error_perm:
        pass


def is_current(facts, size, mtime):
    if not facts or facts.get('type') != 'file':
        return False
    if int(facts.get('size', -1)) != size:
        return False
    remote = time.mktime(time.strptime(facts['modify'][:14], '%Y%m%d%H%M%S')) - time.timezone
    return remote >= int(mtime)


def mirror(ftp, local_root, remote_root, args, owned_dirs):
    local_base = os.path.join(ROOT, local_root)
    known = set()
    sent = 0
    for here, dirs, files in os.walk(local_base):
        rel = os.path.relpath(here, local_base).replace(os.sep, '/')
        rel = '' if rel == '.' else rel
        remote_dir = posixpath.join(SITE_DIR, remote_root, rel).rstrip('/')
        listing = remote_listing(ftp, remote_dir)
        if listing is None and not args.dry_run:
            ensure_dir(ftp, remote_dir, known)
            listing = {}
        listing = listing or {}
        dirs.sort()
        for name in sorted(files):
            if name in SKIP_NAMES:
                continue
            path = os.path.join(here, name)
            st = os.stat(path)
            if is_current(listing.get(name), st.st_size, st.st_mtime):
                continue
            target = posixpath.join(remote_dir, name)
            print('put', target, st.st_size)
            sent += st.st_size
            if args.dry_run:
                continue
            with open(path, 'rb') as fh:
                ftp.storbinary('STOR ' + target, fh, 1 << 16)
            stamp(ftp, target, st.st_mtime)
        if args.delete:
            local_names = set(files) | set(dirs)
            for name, facts in listing.items():
                if name in local_names:
                    continue
                if not rel and not remote_root and name in owned_dirs:
                    continue
                target = posixpath.join(remote_dir, name)
                print('del', target)
                if not args.dry_run:
                    remove(ftp, target, facts.get('type'))
    return sent


def remove(ftp, path, kind):
    if kind == 'dir':
        for name, facts in ftp.mlsd(path, facts=['type']):
            if name not in ('.', '..'):
                remove(ftp, posixpath.join(path, name), facts.get('type'))
        ftp.rmd(path)
    else:
        ftp.delete(path)


def newest_zip():
    found = sorted(glob.glob(os.path.join(ROOT, 'dist', 'Win98*.zip')), key=os.path.getmtime)
    if not found:
        sys.exit('No dist/Win98*.zip')
    return found[-1]


def upload_zip(ftp, path, dry_run):
    size = os.path.getsize(path)
    target = posixpath.join(SITE_DIR, ZIP_REMOTE)
    part = target + '.part'
    try:
        if ftp.size(target) == size:
            print('zip is current:', target)
            return
    except ftplib.error_perm:
        pass
    print('zip', os.path.basename(path), '->', target, size)
    if dry_run:
        return
    ensure_dir(ftp, posixpath.dirname(target), set())
    try:
        offset = ftp.size(part) or 0
    except ftplib.error_perm:
        offset = 0
    done = [offset]
    started = time.time()

    def progress(block):
        done[0] += len(block)
        if done[0] % (64 << 20) < len(block) or done[0] == size:
            rate = (done[0] - offset) / max(time.time() - started, 1) / 1e6
            print('  %.0f%% %.1f MB/s' % (done[0] * 100 / size, rate), flush=True)

    with open(path, 'rb') as fh:
        fh.seek(offset)
        ftp.storbinary('STOR ' + part, fh, 1 << 20, callback=progress, rest=offset or None)
    try:
        ftp.delete(target)
    except ftplib.error_perm:
        pass
    ftp.rename(part, target)
    stamp(ftp, target, os.path.getmtime(path))


def main():
    parser = argparse.ArgumentParser(description='Upload pennygachi.men to the cloud4box hosting over FTPS')
    parser.add_argument('--zip', action='store_true', help='also upload the newest dist/Win98*.zip as files/Win98.zip')
    parser.add_argument('--delete', action='store_true', help='remove remote files that are gone locally')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--ls', metavar='PATH', help='only list a remote folder')
    args = parser.parse_args()

    ftp = connect()
    if args.ls is not None:
        print('pwd:', ftp.pwd())
        for name, facts in sorted((remote_listing(ftp, args.ls) or {}).items()):
            print(facts.get('type', '?'), facts.get('size', ''), name)
        ftp.quit()
        return

    owned = {remote for _, remote in TREES if remote} | {posixpath.dirname(ZIP_REMOTE), 'update', 'web98'}
    total = 0
    for local_root, remote_root in TREES:
        total += mirror(ftp, local_root, remote_root, args, owned)
    print('sent %.1f MB' % (total / 1e6))
    if args.zip:
        upload_zip(ftp, newest_zip(), args.dry_run)
    ftp.quit()


if __name__ == '__main__':
    main()
