(function (S) {
  'use strict';
  S.OBJECTS = {
    fridge: { price: 650, env: 0, section: 'Кухня', icon: 'eat', ads: ['fridge_snack', 'fridge_cold', 'cook_meal', 'eat_leftovers', 'sneak_snack', 'veggie_snack'] },
    stove: { price: 480, env: 0, section: 'Кухня', icon: 'cook', ads: ['cook_meal', 'check_stove'] },
    counter: { price: 110, env: 0, section: 'Кухня', icon: 'cook', ads: ['eat_meal', 'polish'] },
    kitchen_sink: { price: 190, env: 0, section: 'Кухня', icon: 'wash', ads: ['kitchen_wash', 'polish'] },
    trash: { price: 25, env: -1, section: 'Кухня', icon: 'cook', ads: ['kick_trash'] },
    table: { price: 220, env: 1, section: 'Столовая', icon: 'eat', ads: [] },
    chair: { price: 60, env: 0, section: 'Столовая', icon: 'sit', rest: true, ads: ['chair_sit'] },
    toilet: { price: 300, env: 0, section: 'Ванная', icon: 'toilet', ads: ['toilet_use'] },
    shower: { price: 620, env: 0, section: 'Ванная', icon: 'wash', ads: ['shower_take'] },
    bathtub: { price: 800, env: 2, section: 'Ванная', icon: 'wash', ads: ['bath_take'] },
    bath_sink: { price: 160, env: 0, section: 'Ванная', icon: 'wash', ads: ['sink_wash', 'mirror_speech', 'polish'] },
    bed: { price: 900, env: 2, section: 'Спальня', icon: 'sleep', ads: ['bed_sleep', 'bed_nap'] },
    small_bed: { price: 420, env: 1, section: 'Спальня', icon: 'sleep', kidSize: true, ads: ['bed_sleep', 'bed_nap'] },
    dresser: { price: 280, env: 1, section: 'Спальня', icon: 'sit', ads: [] },
    nightstand: { price: 70, env: 1, section: 'Спальня', icon: 'sit', ads: ['pocket_thing'] },
    sofa: { price: 650, env: 2, section: 'Гостиная', icon: 'sit', rest: true, ads: ['sofa_sit', 'sofa_nap'] },
    armchair: { price: 340, env: 2, section: 'Гостиная', icon: 'sit', rest: true, ads: ['chair_sit'] },
    coffee_table: { price: 120, env: 1, section: 'Гостиная', icon: 'sit', ads: [] },
    tv: { price: 750, env: 1, section: 'Гостиная', icon: 'tv', ads: ['tv_watch', 'tv_workout', 'tinker'] },
    stereo: { price: 420, env: 1, section: 'Гостиная', icon: 'music', ads: ['stereo_listen', 'tinker'] },
    bookshelf: { price: 300, env: 3, section: 'Гостиная', icon: 'book', ads: ['book_read', 'read_cooking', 'read_athletic', 'read_logic', 'read_charisma', 'pocket_thing'] },
    desk: { price: 240, env: 1, section: 'Кабинет', icon: 'book', ads: [] },
    computer: { price: 1100, env: 1, section: 'Кабинет', icon: 'keys', ads: ['computer_play', 'computer_chat', 'work_home', 'tinker'] },
    lamp: { price: 90, env: 2, section: 'Свет', icon: 'sit', ads: [] },
    easel: { price: 260, env: 2, section: 'Досуг', icon: 'paint', ads: ['easel_paint', 'mock_art'] },
    punchbag: { price: 180, env: 0, section: 'Досуг', icon: 'punch', ads: ['punchbag_hit'] },
    chess: { price: 210, env: 2, section: 'Досуг', icon: 'chess', ads: ['chess_play'] },
    toybox: { price: 95, env: 1, section: 'Досуг', icon: 'toy', ads: ['toybox_play'] },
    mailbox: { price: 40, env: 0, section: 'Двор', icon: 'scroll', outdoor: true, ads: ['mailbox_check'] },
    grill: { price: 280, env: 0, section: 'Двор', icon: 'cook', outdoor: true, ads: ['grill_cook'] },
    bush: { price: 45, env: 0, section: 'Сад', icon: 'tree', outdoor: true, ads: ['water_bush'] }
  };

  S.baseOf = item => {
    const kind = S.KINDS[S.KIND_ID[item.kind]];
    return kind ? kind.object || kind.model || null : null;
  };

  S.objectOf = item => {
    if (item.gone) return null;
    const base = S.baseOf(item);
    return base ? S.OBJECTS[base] || null : null;
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
