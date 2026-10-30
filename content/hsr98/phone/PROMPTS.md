# Обои телефона HSR 98: промпты

Картинки генерируются в ChatGPT, Gemini или Grok, как арт конусов. Обработку и подключение в игру делает `tools/hsr-cone-pix.py --phone`.

## Как делать

1. Открой чат с генерацией картинок. Приложи обои из игры как референс и вставь промпт.
2. Сохрани результат в любую папку. Имя файла: ключ обоев, например `nexttoyou.png`.
3. Запусти `python tools/hsr-cone-pix.py --phone nexttoyou путь/к/nexttoyou.png --pixel --colors 64`.
   - Скрипт вырежет 268 × 464, сведёт палитру и положит результат в `content/hsr98/phone/nexttoyou.png`.
   - Затем он пересоберёт `js/apps/hsr98/hsr-phone-pix.js`, который игра читает.
4. Пока картинки нет, игра рисует заглушку из кода.

Важное попадает в верхние 120 точек: ниже всё закрывают плитки телефона.

## Промпты

### `nexttoyou`: Навсегда рядом

> Authentic low-res 16-bit pixel art illustration for a 1990s JRPG phone wallpaper (SNES / early PlayStation era). Tall portrait orientation, aspect ratio 9:16. Chunky, clearly visible square pixels, distinct pixel grid, stepped pixelated outlines, limited 48-color palette, checkerboard dithering, strictly no anti-aliasing, no smooth vector lines, no high-res gradients, no text. Festive red and orange background with golden sunburst rays and ornamental golden mandala suns. In the top part: Pom-Pom, a small cream-white rabbit-like train conductor in a dark uniform with a red-and-gold conductor hat, joyful, surrounded by three small round cheerful companion creatures, all looking happy together. The lower two thirds are only the red and gold ornamental pattern, simple and calm.
