(function () {
  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const RANGES = { sx: [-1.6, 1.6], sy: [-1.6, 1.6], d: [0.1, 4.0], roll: [-1.4, 1.4] };
  const RAW = [
    ['herm', 0.0, 'zXzfydxpxdxwxPy7xRx4vYuKtVt6sxrOrdqypQpcoFosorp4pIqoqyqFqPqT', 'zTzZAQCpDVFjG6GQH2H7HcGHG3ELDVCNC3B9AGB7CfDoDTDbBYyLvDsrr8qx', '1W222i2E343w404u4U5d5p5I5W6869605I594z3T3k2L2t2i2c241Y1U1P1L', 'zRzLzZzXzXzyyRymy3y9yfylylyyyxyDyyyBywywywywymxWxrx1vPuGtvtr'],
    ['harry', 4.0, 'ymv2qtmPnoqitJvOwlvHuUu2tOtJtGtCtztxtvtltbthtNuxv0uNultZuaukuJv3vDw8wPxvy1ypyAziAfBACEDqDwD1CvCaC8', 'A9AmB7BZCNCLAMxtu4scrOs0sgsKtktUu5u9u9ucutvgwbwVx8x2vLtbpEn8lWmunBpoqtqHpEoBonpPrusLstrFqqp2nWnsnx', '2B2B2E2K2V3b3J4n4Y5h5p5t5m5c504S4N4K4J4F4z4s4o4n4l4j3X3x2Y2K2B2K2T34383i3C4e4O5F6e7f8q9yaa9S9y9c99', 'uMuttRtqtctctjtIuzvnw0wcwpwwwCwJxgxUyzyVzazayZyKyvy1xmwpvIvhvev8v7v9vlvEvYwmwEx1xkxFy7yAyWz8zbzfzf'],
    ['volde', 10.8, 'ykygxOwkunsEs0s5sUv2xKA5BjBLBqAAziyZzDAHATA4z8y3x5wdw7wUy6zxAmAbzAz0z1ypwYv8tVuauZwxy1zhzqyZyGyWzczlzrzwzzznz6yLyzyryByMyVylxswlvGvo', 'LmKfHyDsz2vbtttiuHxszJBpBKCRDTFEGHHuHhGZGBGoFnErDvDiCTCeBzAIzJxqvwuUwFzODHHOKwLELyLiKyK3J7I0FsDuCbC5BeArzEzEzxzqz5yyxSxqxyyFAeCaDqEa', '8o8g807C7l736S6q5X5z5d4W4G514S5a5a5C5C5D616v6W797i7r7y7C7A7A7x7x7t7n7h746U6L6z6n635M5r574Y4U4Q4J4A4w4t4t4t4q4s4v4B4H4Q585l5A5L5Y6a6f', 'COC2zRx3uwsSsns8tbwhAtErGmHLIkIhHvGLGLGZHaHjHnHzI0IHJlJTKdKAKHKLKIKzKfJKJfIQHFGzFvFeEYENEVF3FnFzFOG6GnGqGdG0G0GrGSHjHjGNF0BFy8vftlsq'],
    ['harry', 18.0, 'HaFWElCxAOyuwGvHvuvFw0wHxJyq', 'sfu7xSBkD4CvBtA5zfyRyAxSwWwm', '9u9p9k8R8l7C6Z6p655T5T5W6c6j', 'yyyGyRyXyXyVyWyXyZyZyZyVyOyK'],
    ['volde', 20.3, 'tstRuEvgvMwrxbxOy7y8y0xSy3ysyQyVyV', 'IWH9DQALz9yUzZC3DVECDPD2CHCXDEElER', '54534T4I4x4q4f403J3z3u3B3R4c4v4L4T', 'yUyXyXySyIyDyDyByvymydy3xMxyxjxjxj'],
    ['herm', 22.5, 'BSBGBqBkB9B0', 'rEt2w5ywA9As', 'bkb0azaha69Y', 'z2yYyQyIyByy'],
    ['harry', 23.5, 'yIxTwDwywYxpxvxjwQwkvTvGvsvbuOuwtZtsssrPrrrxrKs1shspsmsbrqqvpEpspypNq3qdr3seu5vfwawAwR', 'sTtruKvYwTxtxKy2y7y6xFxcwPwLwHwBw7vetNsArLrIsktcu8uCuKuBunu9tvsNsbs5sksysrs2rnqzpjocnA', '7p7g746W6T6F6j5U5G5x5o5g5a595a5e5m5r5v5v5v5x5z5G5L5L5G5A5w5s5p5m5i5j5n5z5M5Z666s6T7p7z', 'yHyVzlzDzNzPzYA7AgAgA9zXzDzmz8yZycxsw0uysZrXr0pRoZoHolo0nGnGnxnjmRm7lrl0l8lVnxpErlswsV'],
    ['volde', 28.7, 'wSwUxkxVyey3xTxWxWxS', 'HEGUDjzyuZslqipxptps', '8b847Z7r706i5P5o5b59', 'INIUJ7J1IkGTFAEQF4Fb'],
    ['herm', 30.7, 'xTxWyBzjAjALB8BaBcBhBOCIEfGmIgJBJUK1JhIaHg', 'jhk5n9qwtVvDwMxuyizsBeDlFxH7HVHCGsECCxB7Ap', '656o6D6Y71716T6G6t6c615V646d6q6q6l665U5M5K', 'uQuJuwukueubu9u6u8uuuPv9vcvhvcvduBtNsRswsw'],
    ['harry', 33.0, 'HvGTFEDgBezwywx1vhu0tzugvqwUxMy5xNwEuSsGqKp8nQmWmFmFmS', 'sFt3tOvmwOyezcADC1DaDyDyD7CcBczOyUy8xpwsvtuHtOsorqqAqu', '7q7u7C7F7F7H7H7x766J6x6F6S767h7m7q7q7q7o7k7c6V6B6m6h6h', 'vuvrvwvrvnv9uAtps3r0qzqoqkqxqXrorCrvr9qMqpqhqlqyqEqEqA'],
    ['herm', 36.9, 'xuAoFoG3FSFhEiDkDzFbHjJ1JxJwIbH9G7GdGlGgFXFrF4ENEUFfFAFIFCFwFsFuFw', 'tquWxlyOzxzYzYzOzNA6AwANASAHAtAeA9AgABAZBlBwBEBHBHBNC9CGDkDIDIDnD7', '7o7j756O6B6B6H6D6t6j6i6j6D7n8o969o9m968L8m897W7P7A7i6U6A6l6c686563', 'usvkwGxFy5yiyaxswFvVv8u1sZsIt2tqtEtEtxsYs2r9qJqzqpqDrBsGtDu0uwuYvi'],
    ['harry', 40.2, 'tmrSoLqEu7xOydxG', 'uUu3sItKybCvHuIo', '1T1S1S1Q1O1S1W22', 'oLoxo6oZqlsktru5'],
    ['harry', 43.5, 'BhCaDpCNAExyvDvawiyuBqDSFkFuFkEjDlD5EbF0', 'ELEFDZCsAyy9wguCu2u9v8xnzBBDCCDrDPEEFNGE', '4Y585q5B5H5J5M5X676g6e615v4R4b3A332F2t2n', 'oKoMoVppq3qOrlsct5u4uGv3vfvkvoviuYuDumuk'],
    ['ron', 46.0, 'KcKmJwImHhI5JjKsKjJiGsDxBo', 'FkGvI7I5HiGkFJELCZBEB8BKCh', 'cgc5bQbJbIbmaD9A8q7F7c7c7b', 'ywyzyGyLyOyPyRzsA3ABAzAtAr'],
    ['harry', 47.3, 'G4EsCpBIDeEKFEEWEeElF4FYG3', 'pIqssguOwGxwxrvYtOrjqbrAsv', '7h7j7t7F7V8c8q8B8C8E8B8B8z', 'v0uZv3v5v2uEu6tFtvtAtLu2ua'],
    ['herm', 48.9, 'uYwny5zxzmylwEuBtA', 'tjv7y5C8EAEZD9AAzv', 'endPcHaQ8S6W5J4T4t', 'u0u5tLtBtttPu1uAuI'],
    ['harry', 49.8, 'BBC3CCC3zAxiwHxg', 'yax8wkxCzDAqBfBi', '2q2r2t2u2y2G2S2Y', 'tWtVtRtbsvrRrMrK'],
    ['ron', 50.6, 'yCykxKxbvIugtRuzvhvwwIzWDrFC', 'HZIJIMGGDhAVyRxXx7wEwRy2zrA9', '5Z6h717I8A9a9B9G9t9g91908Y8Y', 'tItIubuEv9vdvivlvbuSuvu5tBth'],
    ['herm', 52.2, 'o2m5ijiviFiH', 'DQDjAXxXuXtN', 'fEfAfAfufhfa', 'u2u5uruOvbve'],
    ['harry', 52.9, 'HnG1EhDuDFDFDpD9COBYB9AwAuArADAI', 'rqrLset2tYvbw3whvotJrZqWqJrCswtl', '8f847N7y7q7a706Q6Q6N6H6s6b5W5P5P', 'ufu6tQtDtntat1titDu5unuJv5vjvqvr'],
    ['harry', 54.4, 'q2ooltqFwfBZCoCMxrrplB', 'FcGSJQECxZquotntvbDpLp', '564Z4C413t3833302S2X2X', 'w7vUvmurtFt6sOsFstsnsd'],
    ['herm', 55.9, 'BmBtB0ywvqsdqMqqrutpv1w8wowivUvwvjvfvauOufrRqH', 'whypBdD1DbD3CPCyBTB4AhzRzHzxzqzdySy7xdwfvvuJum', '717a7o7v7x7x7j7j7l7i7h7k7F808n8J8P8P939r9Ra2a3', 'usuKvmvRwqwOx7xbwPvVv1utuEuYvjvuvvvwvwvyvxvtvo'],
    ['ron', 58.9, 'uQuDuasRrzpoo4nEo2', 'GyHvIVI4GzF4EXFiFv', '4z4o423B3d2S2G2v2q', 'wqw8vIvfuKu3tztltk'],
    ['herm', 62.0, 'nxoMsvvqxfwHw8vQ', 'q6pfmWlckrlim8my', '5L5O5O646i6k6A6B', 'wjwYygzHB6CoCRD2'],
    ['ron', 62.8, 'AwyPvhsRsluZyKC1DMEf', 'JfILHIGoFoE6zDuQqtq1', '979a9f8X8l745O4Z4Z4Y', 'iFiFiFiCiCjokdlKnLpa'],
    ['volde', 64.5, 'xYxYxYxYxYxYxYxYxPxyxawKwrvYvGvEvSw5vMvduxu4tHtfsSsGsRtetSuzv5vivwwNyGArB7APzNxPvPuuuhv7wvxIyhy9y6', 'L5L5L5L5L5L5L5L5KiIIGsEqCTC2BLBQBVBHBpBkBABRBHB8AvzXztyzxHx1wPxcxLzcAWCGDxDtD0C2ArygwCwax1ywAcBUCH', '9x9x9x9x9x9x9x9l8V8p7Z7K7v7b6G645z554P4D4F4O4Z5t5U6A7c7X8v8U9b9t9D9O9Ta0a2a49W9O9w948e7k6s5N594H4t', 'wTwTwTwTwTwTwTwovsuuu2u2uhuEvevIwawpwvwavCtbqKnqlYkQlynlpQsqu8vuwrxHyCzazcz7yEyaxNylz1zHzPzXzWzQzE'],
    ['harry', 69.9, 'DTDHDGE8EBDnBtzxyAxXx0vLuvtgslrrqupMoPobnrn5mNn6nEoooFoFofnamfkUjWiYiYjNkJm2mOnZnonl', 'GXHWJBKJKFJcHoFnEaDhCOCsC6CcCCDFERFTGGH9HuHkGYGwFOF2DOCRCcCgCpCxCDD4DBE2E0DlCHBzBzBg', '9c8Q8a7F7o716z5Y5E5o5f57555h5E6q777L8h8J9397989b9o9A9K9K9F9z9u9C9D9D9v9v9r9n9c9e969b', 'zAzvA4AwBqCbCZDAEpF0FAFnEMDAChB1zUyUxFvHtDryqupuoomBkYkdkhlBmUoJpHqCr4s1tAvwwXy4z7zF'],
    ['harry', 74.0, 'okp1qEpVopmdjZj2', 'yKwYubtotytLuiuv', '8O8F8h7Z7I7u7a6Z', 'zXzIzozeztzWAuAL'],
    ['volde', 76.7, 'DBD9C3AQzPyQy1wFvCuRuLuXvavpvPwux8xIy2y0xtwNwdvVvYwrx0xoxwxdwEviu2t8', 'HpFGCIATAiBgCqDwDrD4CBCgBJAIzIyWyLzcAECBEoFcEODECeBrB8B3B8BQDaFrHcIi', '5Z656g6A6Q757676716Y6P6G6v6n665E574J4B4K555t5Q646h6y6O7a7t8o9hawbEcm', 'ECEAExDWDnBQAnyyxowAwawawzx2xVz5AaAWBsDpFnH2HhHlHpHxHqHeH4GHGjFMG2G8'],
    ['harry', 80.4, 'xsw6tvqVpFqjrJt9sRqPopnb', 'srs5rsrorwrTtyvCylzNASAY', 'bBbeaKaqaia39I9g8Q8v8g88', 'xexmxyxjxjxjy1yEzhzvzizb'],
    ['volde', 82.4, 'z3yVyIyJyPyPy5xgw5uYtEszs4s7t8uNwcwnvCuOuuutu1tztEutvwwbwzw2uNtxsLsF', 'FNFAE4BZzRzcyEyPzsA5AvzZznyLz1zuzWzCz7yCyzyMzJB0CbCSDgDYEqErDLD4CnCa', '7S7I7p706C6j6b6b6c6966615P5u534I4x4S595r4D3M312Z363i3H4n545z676x6Z74', 'zFAnBJCSDyDPCFBmztyhx8wzwswswswswzwtwWxjxVyqznAkANANANANBJCMDPDTDLDF'],
    ['harry', 86.2, 'xCwWvSvLwoxhygyTzrzOAaAkAfA0zFzvzozpAjBEDnE1', 'sksHt0ubvoxdyrzHAnAUAVAJA4zgyAypz3zLACAYBvBO', '9D9w9l998P8t837E726A665K5j514T4O4L4L4N4N4N4M', 'ueukuCuXvhvDvYwiwwwFwNx3xOyRzIA4A3zWzvyKxEx6'],
    ['herm', 88.6, 'iGjLnIsawPyZz2x5u7sz', 'tltmu0v6wSxZyAyixPxz', '5s5f4Q4T5k5T7TaUe6fG', 'tctit1t1tgtMuJvDwyx0'],
    ['harry', 89.7, 'ArwMrin6lPn4prtawbyJzH', 'yFzdzTAHB8BGBVBqA1xEwq', '5o5e4Y4O4H4A4n453O3D3C', 'wVxfxHxUxOxnwVwpwdw1w0'],
    ['volde', 91.4, 'zkzmzrziynw9tIrWrts1tIvNxfxnwFvAuJuqvmwiwZwAw8vPwmxOzLBjBV', 'w0yCBuDyDbCSDaDwDKDdBWAKA8AiB1CdDNEQFkFiE9CoALAcAFBbBFBMBO', '6W6Y6Y6Y70767d7m7v7K7Y8e8j8n8q8v8z8A8B8B8B8C8E8G8I8J8R999m', 'wrwBxhxUyqyqxWxrx1xoyvzKBcCjDiDHCUC6AQAjzyyQxRwRwhwhwCx6xh'],
    ['harry', 94.8, 'GTGsEICczCyhy2yWAYCODCCLB2zzyCyQzzADBKCf', 'tptMvnxeznBzCWE6EjEPFFGCHdHaGgEJCPB6ztyF', '7Z7W7O7B756m5p4E3P3i2V2N2J2F2D2D2D2C2C2C', 'zJzkyAybxTxyxex1x2x6xixyxLxQxXy4ygytyMyV'],
    ['volde', 97.3, 'xey0z1zrzaywxEw7uytgsQtrugvavww4wIxWzkBqD2E5EfDXDhC6BdAPAVALAD', 'HvF2AwxmvIvivswcxEyXA3AqAyAgzVzszczbzozDzPAaAHBcBxBhAIzzyIxXxO', '7g7p7H838D9d9r9r9r9d8U8y8d7J716k5Q5u5g4N4q484l4A565L6t6Y787d7f', 'xRyvzpzQzQzzyWxywlvvvvvGwbwTxyyxzxAvBGCRE6EyEZFvG9GvGJGJGIGCGA'],
    ['volde', 100.3, 'zBztyEx7uWtqsG', 'zUypvhtmsnsnss', '4c4b40433Y4340', 'CCBhzky7xXxNxS'],
    ['harry', 101.5, 'FIFjExDnCgBczMyXyKzPAPCgCN', 'xQyKAxDHG9HTIxHKFxCFB1BoBN', '4Q4Q4D4q3Z3J3t3u3D3T4d4A4M', 'F9EtD5CxBZzhwAuMvAwBx2xgxh'],
    ['volde', 103.4, 'zMzMzMzMzMzqyrxiwpvDulsaqjpd', 'MYMYMYMYMYLiHcCjxYw4vgvzwtwL', 'cmcmcmcmbn9O847e6Q6E675A4W4M', 'zizizizizizrzJA7AsAEB4BrBLBN'],
    ['harry', 104.9, 'J3J3FKCoz5AxDjGHIKJzJFJzJhJ0IIIGIAIrI4HMHG', 'sJsJwLB2FyGEHvHCGXG7FHFjEYEDEiDHCRBxAAA0A0', 'CyxemDbZ6G6G727p7N7V85817H756u635Q5Q5T5R5R', 'u5uCvkwnx1xmxixgxcx1wwwnwBxdxPxYyayayryzyD'],
    ['volde', 107.0, 'n4n4oJsmvHxbvWuZud', 'KcKcIyFdBVAhAnAsAw', '6x6k615S5N5N646W7A', 'BABbAnzzz2yUyEyvyn'],
    ['harry', 107.8, 'xRwGu8sjrismuowrxox1wDwCy2zFB6Bp', 'uEvyxuyPzLzZAgAlAsAxAqA0zlyQyxyv', '7m7j7b79756Z6D6f5M5l4T4s4c3Z3S3P', 'wNwXx6x6xbxnxFxWygysyAyIyLyOyXz5'],
    ['volde', 110.2, 'smsFtVuZulsQs0sTucwJzaBbATAmztysxtwS', 'EbDIBRzFxNyXDMJhMON5MtM8LPL4HbD9zYzI', '4b4a49494c5M8vbcckbU9H754S4q4j433K3y', 'zBACBlBdBdB9AhAjCKHBKPMrMrKAGuCoA8A8'],
    ['ron', 112.5, 'lWl1jDivi9', 'wNyfBcESGK', 'i7hMhhgWgQ', 'tWu0ueuDuS'],
    ['harry', 113.0, 'AoDgIkIOIbHbGkFTFNFDEXDICAC0C1BXBqASBiBJ', 'AJzhwpwjwIx9xxxlx8xdxYztCgEwFSFjDOCrCaCw', '7U7O7B7g6W6p5T5e4A3Y3r3d34302X2X2X2W2W2W', 'zJAmBhBCBtBkBaBhBnBuAnzbxXxNxIxFxFxGxJxM'],
    ['volde', 115.4, 'nlr0vLxAvQu1sBs5rDrvrIsot5tztyt5rFqfpdpup7nPmanUpf', 'AcBpCxFkGvHdETCoAkzDzrz4yLyfxSwrveu5vaxAAkC3CrE6EU', 'gLgLewa25p2V2E2w2u2u2v2v2v2w2w2Q3x4B5b5u5i6S8mbwcj', 'xkxkxkxxxWyTzJALBhBHBHCoD5DNCIBpzQz1z1zDBrAHzEvJuL'],
    ['harry', 117.8, 'ASzFvar3vCDjKpJGIVINJaJBK1K3', 'M4LKIvE0xyu1tfvby8zAACAzAzAx', 'eGeFd6ah7t6r6I7074757d7t7P7Z', 'rNrMrJrHsZujvDvDvCvCvNw7wJx3'],
    ['herm', 120.5, 'GJGCAfukoqpeqBsJujutt9rCqN', 'yayXydy0wivRvAvLvWvtustbsw', 'kSkMkyjWjnhLgheEdScvaX9k8N', 'uwusurululueu6tXtLtyt1smrS'],
    ['ron', 122.0, 'AsAnA9zUzszg', 'HoGJEYCyAszj', '8f8f8f8e8d8e', 'tct7sXsMsCsz'],
    ['ron', 123.3, 'qyq8pqoToCoLpArmt2uduHvRwz', 'AKzJymxiwQw5vAvrvLwpx9yGzs', '2J2J2I2I2I2O353D4q5z6z7m7y', 'oVoVoUoHobnGnonpnAnLo1ocok'],
    ['herm', 125.0, 'x5x6w7uwsxryrCszvfy4ANCaCYDoD8CoB6A4yYybx9www4vZ', 'wlxjyTzpyOyaxvxBxVyfytysyqxVxswYwlvHvswfxQzhAxAS', '6K6E6w5S51423m2W2E2E2G2M2Q2Z3439393d3i3m3m3l3i3g', 'u7u9u9ufuEv2vrv4uFubu3tKttt9t2sZtbtmtxtksVsmrLrs'],
    ['volde', 128.1, 'rwsltgtUtOtXulvCwEwYvWunsWrRreqrpbnvmqlSm3mMocpyqsqGqIqFqCqKr1rqrHrmqopponnDmZ', 'nUoTrUx4BEEnEUFpGCIqJSK1IQH8FTFnFiE8CYBYC4CMDZFKGVHgGGFiDNCzCdCQEhG0H6HpHkGLGv', '6w6E6U787j7H8OarbOcXdBegexeSfafgfffeeHe7dwd3cmbsaIac9O9D9p9h9a9d9g9i8Z8C8c827X', 'BeBiBrBuBuBuBuBsBjBaB1ATAKABAsAkAbA2zTzLzCztzkzCAkB7BzBDBFBnB4AKAEAFAJADAqAbAb'],
    ['herm', 132.4, 'yyxZx7xny3yE', 'kqlin0psrOtn', '897V7u756I6y', 'qvqGqJrzrKrP'],
    ['volde', 139.5, 'o5oypvrlt8uXvZwEwNwuvXvcuztPtcsIsrses8', 'xNxTy5yKziAfAOBqBDBNC2CuDgEoFhGaGJHpHE', '9x9z9Ka5araCaSb3bebeb7aYaOaKaqa79L9A9u', 'AKBfBXCDCPCOCNCNCRDoDZEzECELEwEwEwEwEx'],
    ['ron', 141.9, 't8sqrsqTqFqhpZ', 'zVAzBTDvF2GlGP', 'd3d3d3d3cYcPcI', 'tXtVtVtTtWtYtY']
  ];

  function decode(str, key) {
    const [lo, hi] = RANGES[key];
    const out = new Float32Array(str.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = lo + ((ALPHA.indexOf(str[i * 2]) * 62 + ALPHA.indexOf(str[i * 2 + 1])) / 3843) * (hi - lo);
    return out;
  }

  const SHOTS = RAW.map(([who, t0, sx, sy, d, roll]) => ({ who, t0, sx: decode(sx, 'sx'), sy: decode(sy, 'sy'), d: decode(d, 'd'), roll: decode(roll, 'roll') }));
  SHOTS.forEach(s => { s.t1 = s.t0 + (s.sx.length - 1) / 10; });

  function find(who, t) {
    return SHOTS.find(s => s.who === who && t >= s.t0 && t <= s.t1) || SHOTS.find(s => s.who === who && t >= s.t0 - 0.35 && t <= s.t1 + 0.35) || null;
  }

  function sample(s, t) {
    const x = Math.max(0, Math.min(s.sx.length - 1.001, (t - s.t0) * 10));
    const i = Math.floor(x), k = x - i;
    const j = Math.min(s.sx.length - 1, i + 1);
    const at = (a) => a[i] + (a[j] - a[i]) * k;
    return { sx: at(s.sx), sy: at(s.sy), d: at(s.d), roll: at(s.roll) };
  }

  window.HogwTrack = { SHOTS, find, sample };
})();
