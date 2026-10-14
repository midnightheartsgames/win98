(function (S) {
  'use strict';

  const BLUEPRINTS = {
    starter: {
      w: 13, d: 13, ext: 'siding_yellow', roof: '#7a4a3a', front: [5, 9], value: 9000,
      rooms: [[2, 2, 6, 7, 'wood_light', 'paint_cream'], [8, 2, 3, 3, 'tile_white', 'tile_bath'], [8, 5, 3, 4, 'carpet_beige', 'paint_blue']],
      doors: 'h 5 9 door_wood; v 8 3 door_white; v 8 6 door_white',
      objs: 'fridge 2 2 2; counter 3 2 2; stove 4 2 2; sink_kitchen 5 2 2; counter 6 2 2; coffee 6 2 2; trash_indoor 7 2 2; table_small 6 5 0; chair_cheap 5 5 1; chair_cheap 7 5 3; loveseat 2 6 1; tv_cheap 4 6 3; lamp_floor 2 8 0; plant_small 7 8 0; toilet 8 2 2; shower 10 2 2; sink_bath 10 4 3; mirror 10 4 3; bed_single 10 5 2; table_end 9 5 2; lamp_table 9 5 2; dresser 8 8 0; alarm_smoke 3 2 2',
      yard: 'flowerbed 3 10 0; flowerbed 7 10 0; bush 1 1 0; tree_small 11 11 0; flamingo 9 11 2'
    },
    cottage: {
      w: 22, d: 13, ext: 'siding', roof: '#5a4a6a', front: [7, 10], value: 16000,
      rooms: [[3, 2, 5, 4, 'checker', 'stripes'], [3, 6, 5, 4, 'wood_light', 'wainscot'], [8, 2, 6, 5, 'carpet_beige', 'paint_cream'], [8, 7, 6, 3, 'carpet_blue', 'paint_blue'], [14, 2, 4, 3, 'tile_white', 'tile_bath'], [14, 5, 4, 5, 'carpet_red', 'floral']],
      doors: 'h 7 10 door_white; h 5 6 arch; v 8 3 arch; v 8 6 door_wood; v 14 3 door_white; v 14 5 door_white; h 12 7 door_white',
      objs: 'counter 3 2 2; counter 4 2 2; stove 5 2 2; sink_kitchen 6 2 2; counter 7 2 2; coffee 7 2 2; dishwasher 3 3 1; fridge 3 4 1; trash_indoor 7 5 0; alarm_smoke 4 2 2; ' +
        'table_dining 4 7 0; chair_wood 4 8 0; chair_wood 5 8 0; chair_wood 3 7 1; chair_wood 6 7 3; plant_small 3 9 0; flowers 4 7 0; ' +
        'sofa_cheap 9 2 2; rug_big 9 3 2; table_coffee 9 4 2; tv_cheap 10 6 0; armchair 12 4 3; bookshelf 13 6 3; lamp_floor 8 2 0; plant_big 13 2 0; ' +
        'toilet 15 2 2; sink_bath 16 2 2; mirror 16 2 2; bathtub 16 4 0; ' +
        'bed_double 15 8 0; dresser 17 5 3; table_end 17 9 3; lamp_table 17 9 3; ' +
        'bed_single 8 8 0; desk 11 9 0; computer 11 9 0; chair_office 11 8 2; toybox 13 7 3',
      yard: 'flowerbed 5 11 0; flowerbed 9 11 0; bush 2 11 0; tree_small 19 3 0; tree_small 20 10 0; grill 19 7 3'
    },
    ranch: {
      w: 26, d: 13, ext: 'siding_blue', roof: '#4a4a52', front: [11, 10], value: 22000,
      rooms: [[3, 2, 5, 4, 'tile_terra', 'paint_cream'], [3, 6, 5, 4, 'wood_dark', 'wainscot'], [8, 2, 7, 8, 'carpet_beige', 'paint_cream'], [15, 5, 8, 2, 'wood_light', 'paint_white'],
        [15, 2, 3, 3, 'tile_white', 'tile_bath'], [18, 2, 5, 3, 'carpet_blue', 'paint_blue'], [15, 7, 4, 3, 'carpet_green', 'paint_green'], [19, 7, 4, 3, 'carpet_red', 'paint_pink']],
      doors: 'h 11 10 door_wood; v 8 3 arch; v 8 7 arch; h 5 6 arch; v 15 5 arch; h 15 5 door_white; h 20 5 door_white; h 16 7 door_white; h 21 7 door_white',
      objs: 'counter 3 2 2; counter 4 2 2; stove 5 2 2; sink_kitchen 6 2 2; counter 7 2 2; coffee 4 2 2; fridge 3 3 1; dishwasher 3 4 1; trash_indoor 7 5 0; alarm_smoke 5 2 2; ' +
        'table_dining 4 7 0; chair_wood 4 8 0; chair_wood 5 8 0; chair_wood 3 7 1; chair_wood 6 7 3; flowers 5 7 0; ' +
        'sofa_mid 10 2 2; rug_big 10 3 2; table_coffee 10 4 2; tv_mid 11 6 0; armchair 13 3 3; bookshelf 14 8 3; lamp_floor 9 2 0; plant_big 14 2 0; stereo 8 9 1; ' +
        'toilet 15 2 2; sink_bath 16 2 2; mirror 16 2 2; shower 17 2 2; ' +
        'bed_double 19 2 2; table_end 18 2 2; lamp_table 18 2 2; dresser 22 4 3; ' +
        'bed_single 15 8 0; desk 17 7 2; computer 17 7 2; chair_office 17 8 0; toybox 18 9 3; ' +
        'bed_single 22 8 0; dresser 19 9 1; plant_small 22 5 0',
      yard: 'flowerbed 9 11 0; flowerbed 13 11 0; tree_small 1 5 0; tree_small 24 11 0; bush 2 11 0; grill 24 4 3; bench_park 20 11 0'
    },
    suburban: {
      w: 26, d: 13, ext: 'brick', roof: '#6a3a2a', front: [5, 10], value: 24000,
      rooms: [[4, 2, 8, 5, 'wood_light', 'paint_green'], [12, 2, 5, 4, 'linoleum', 'paint_white'], [12, 6, 5, 4, 'wood_dark', 'wainscot'], [4, 7, 4, 3, 'tile_terra', 'paint_cream'],
        [8, 7, 4, 3, 'carpet_blue', 'stripes_blue'], [17, 2, 5, 3, 'tile_white', 'tile_blue'], [17, 5, 5, 5, 'carpet_beige', 'floral']],
      doors: 'h 5 10 door_glass; h 5 7 arch; h 9 7 door_white; v 12 3 arch; h 14 6 arch; v 17 4 door_white; v 17 7 door_white',
      objs: 'sofa_mid 5 2 2; table_coffee 5 4 2; tv_mid 6 6 0; armchair 8 4 3; bookshelf 11 2 2; chess 9 5 0; lamp_floor 4 2 0; plant_big 4 6 0; ' +
        'fridge 12 2 2; counter 13 2 2; stove 14 2 2; sink_kitchen 15 2 2; counter 16 2 2; coffee 16 2 2; dishwasher 16 3 3; trash_indoor 12 5 0; alarm_smoke 13 2 2; ' +
        'table_dining 13 8 0; chair_wood 13 9 0; chair_wood 14 9 0; chair_wood 15 8 3; chair_wood 13 7 2; chair_wood 14 7 2; flowers 13 8 0; ' +
        'bathtub 17 2 2; sink_bath 19 2 2; mirror 19 2 2; toilet 20 2 2; shower 21 2 2; ' +
        'bed_double_mid 19 8 0; dresser 21 5 3; table_end 21 9 3; lamp_table 21 9 3; ' +
        'bed_single 11 8 0; desk 8 9 0; computer 8 9 0; chair_office 8 8 2; plant_small 4 9 0',
      yard: 'flowerbed 3 11 0; flowerbed 8 11 0; tree_small 24 3 0; tree_small 23 10 0; lamp_garden 7 11 0; flamingo 12 11 0'
    },
    family: {
      w: 22, d: 22, ext: 'siding', roof: '#3a5a4a', front: [11, 14], value: 34000,
      rooms: [[3, 2, 6, 5, 'checker', 'paint_white'], [9, 2, 6, 5, 'carpet_green', 'wood_panel'], [15, 2, 4, 3, 'tile_white', 'tile_bath'], [15, 5, 4, 5, 'carpet_beige', 'floral'],
        [3, 7, 6, 4, 'wood_light', 'wainscot'], [9, 7, 6, 7, 'herring', 'paint_cream'], [3, 11, 6, 3, 'carpet_blue', 'stripes_blue'], [15, 10, 4, 4, 'carpet_red', 'paint_pink']],
      doors: 'h 11 14 door_glass; h 11 7 arch; v 9 8 arch; h 5 7 arch; v 9 3 arch; v 15 3 door_white; v 15 8 door_white; v 15 11 door_white; h 5 11 door_white',
      objs: 'counter_granite 3 2 2; counter_granite 4 2 2; stove 5 2 2; sink_kitchen 6 2 2; counter_granite 7 2 2; dishwasher 8 2 2; fridge_lux 3 3 1; counter_granite 3 4 1; coffee 3 4 1; trash_indoor 8 6 3; alarm_smoke 4 2 2; ' +
        'sofa_cheap 10 2 2; tv_mid 11 5 0; recliner 13 4 3; stereo 14 2 3; toybox 9 6 1; ' +
        'bathtub 16 2 2; toilet 18 4 3; sink_bath 18 2 3; mirror 18 2 3; ' +
        'bed_double_mid 16 5 2; table_end 18 5 3; lamp_table 18 5 3; dresser 18 9 3; ' +
        'table_dining 5 8 0; chair_wood 5 9 0; chair_wood 6 9 0; chair_wood 4 8 1; chair_wood 7 8 3; flowers 5 8 0; ' +
        'sofa_mid 12 13 0; rug_big 12 10 0; table_coffee 12 11 0; armchair_lux 9 10 1; bookshelf 9 13 1; lamp_floor 9 12 0; plant_big 14 7 0; ' +
        'bed_single 8 12 0; desk 3 13 0; computer 3 13 0; chair_office 3 12 2; ' +
        'bed_single 18 12 0; crib 15 13 0; toybox 17 10 2',
      yard: 'swingset 15 16 2; grill 4 17 1; bench_park 5 19 0; flowerbed 9 15 0; flowerbed 13 15 0; tree_small 1 16 0; tree_small 20 19 0; lamp_garden 10 18 0; bush 1 3 0; bush 20 3 0'
    },
    townhouse: {
      w: 13, d: 22, ext: 'stucco', roof: '#7a3a2a', front: [6, 17], value: 14000,
      rooms: [[2, 11, 9, 6, 'wood_light', 'paint_cream'], [2, 7, 5, 4, 'checker', 'paint_white'], [7, 7, 4, 4, 'wood_dark', 'wainscot'], [2, 3, 3, 4, 'tile_white', 'tile_bath'], [5, 3, 6, 4, 'carpet_beige', 'paint_blue']],
      doors: 'h 6 17 door_wood; h 4 11 arch; h 8 11 arch; v 7 9 arch; h 3 7 door_white; h 8 7 door_white',
      objs: 'sofa_cheap 5 11 2; tv_cheap 6 14 0; armchair 9 13 3; bookshelf 2 16 1; lamp_floor 2 12 0; plant_small 10 16 0; ' +
        'counter 2 7 1; fridge 2 8 1; stove 2 9 1; counter 2 10 1; sink_kitchen 5 7 2; counter 6 7 2; coffee 6 7 2; trash_indoor 6 10 3; alarm_smoke 5 7 2; ' +
        'table_small 9 9 0; chair_cheap 9 10 0; chair_cheap 10 9 3; chair_cheap 9 8 2; flowers 9 9 0; ' +
        'toilet 2 3 2; shower 4 3 2; sink_bath 2 5 1; mirror 2 5 1; ' +
        'bed_double 6 3 2; table_end 5 3 2; lamp_table 5 3 2; dresser 10 6 3',
      yard: 'flowerbed 3 18 0; flowerbed 9 18 0; tree_small 1 20 0; bush 11 20 0; lamp_garden 7 19 0'
    },
    mansion: {
      w: 22, d: 22, ext: 'stone', roof: '#3a3a44', front: [10, 16], value: 90000,
      rooms: [[8, 11, 6, 5, 'marble', 'paint_white'], [2, 11, 6, 5, 'herring', 'wainscot'], [14, 11, 6, 5, 'wood_dark', 'damask'], [14, 6, 6, 5, 'marble', 'paint_white'],
        [2, 6, 6, 5, 'wood_dark', 'wood_panel'], [8, 6, 6, 5, 'marble', 'paint_cream'], [2, 2, 7, 4, 'carpet_red', 'damask'], [9, 2, 4, 4, 'marble', 'tile_blue'], [13, 2, 7, 4, 'carpet_blue', 'stripes_blue']],
      doors: 'h 10 16 door_fancy; v 8 13 arch; v 14 13 arch; h 10 11 arch; v 8 8 door_wood; v 14 8 arch; h 16 11 door_wood; h 10 6 door_white; h 8 6 door_wood; h 13 6 door_wood',
      objs: 'sculpture 12 12 0; plant_big 8 15 0; plant_big 13 15 0; rug_big 9 12 0; clock_grand 13 11 2; ' +
        'sofa_lux 3 11 2; table_coffee 3 13 2; tv_lux 3 15 0; armchair_lux 6 12 3; stereo_lux 7 15 0; lamp_floor 2 11 0; ' +
        'table_dining_lux 16 13 0; chair_wood 16 14 0; chair_wood 17 14 0; chair_wood 16 12 2; chair_wood 17 12 2; chair_wood 15 13 1; chair_wood 18 13 3; flowers 16 13 0; ' +
        'counter_granite 19 6 3; fridge_lux 19 7 3; stove_lux 19 8 3; sink_kitchen 19 9 3; counter_granite 15 6 2; counter_granite 16 6 2; dishwasher 17 6 2; counter_granite 18 6 2; coffee 16 6 2; trash_indoor 14 10 0; alarm_smoke 15 6 2; ' +
        'desk_lux 3 6 2; computer_lux 3 6 2; chair_office 3 7 0; bookshelf_lux 6 6 2; chess 3 9 0; armchair_lux 7 10 3; ' +
        'treadmill 11 7 2; weights 12 9 2; plant_big 9 10 0; ' +
        'bed_double_lux 4 2 2; table_end 3 2 2; lamp_table 3 2 2; table_end 6 2 2; lamp_table 6 2 2; dresser 2 5 1; armchair_lux 7 2 2; ' +
        'bathtub 9 2 2; toilet_lux 12 2 2; sink_bath 11 2 2; mirror 11 2 2; shower 12 4 3; ' +
        'bed_double_mid 15 2 2; desk 18 2 2; computer 18 2 2; chair_office 18 3 0; stereo 13 2 2; guitar 19 5 0',
      up: {
        rooms: [[2, 6, 6, 5, 'carpet_green', 'wood_panel'], [8, 6, 6, 5, 'wood_light', 'paint_cream']],
        decks: [[8, 11, 6, 5, 'deck']],
        stairs: 'stairs_wood 2 7 0',
        doors: 'v 8 8 arch; h 11 11 door_glass',
        objs: 'bookshelf_lux 4 6 2; bookshelf 6 6 2; bookshelf 7 6 2; armchair_lux 4 9 0; armchair_lux 6 9 0; table_end 5 9 0; plant_big 3 10 0; lamp_floor 7 10 0; lamp_table 5 9 0; ' +
          'easel 9 7 2; easel 11 7 2; stereo_lux 13 6 2; armchair_lux 13 9 3; plant_big 8 10 0; rug_big 9 8 0; ' +
          'telescope 9 15 2; bench_park 11 15 2; plant_big 8 11 0; plant_big 13 11 0'
      },
      yard: 'flowerbed 8 17 0; flowerbed 12 17 0; lamp_garden 9 19 0; lamp_garden 12 19 0; bush 2 17 0; bush 3 17 0; bush 20 16 0; bush 21 16 0; tree_small 1 20 0; tree_small 21 19 0; grill 20 21 0; telescope 4 19 0; bench_park 20 17 3; sculpture 5 17 0'
    },
    manor: {
      w: 24, d: 22, ext: 'stone', roof: '#2a2a34', front: [11, 16], value: 60000,
      rooms: [[9, 10, 6, 6, 'marble', 'gothic'], [3, 10, 6, 6, 'wood_dark', 'wood_panel'], [15, 10, 6, 6, 'wood_dark', 'damask'], [15, 6, 6, 4, 'checker', 'paint_white'],
        [3, 6, 12, 4, 'carpet_red', 'gothic'], [3, 2, 6, 4, 'carpet_red', 'damask'], [9, 2, 5, 4, 'marble', 'tile_bath'], [14, 2, 7, 4, 'carpet_blue', 'gothic']],
      doors: 'h 11 16 door_fancy; v 9 12 door_wood; v 15 12 arch; h 11 10 arch; v 15 7 door_wood; h 17 10 door_wood; h 5 6 door_wood; h 11 6 door_white; h 14 6 door_wood',
      objs: 'clock_grand 9 10 1; plant_big 14 15 0; sculpture 13 14 0; rug_big 10 12 0; ' +
        'bookshelf_lux 3 10 2; bookshelf 5 10 2; bookshelf 6 10 2; bookshelf 7 10 2; chess 4 13 0; armchair_lux 8 14 3; desk_lux 6 15 0; computer 6 15 0; chair_office 6 14 2; lamp_floor 3 15 0; ' +
        'sofa_lux 6 9 0; table_coffee 6 7 0; tv_mid 7 6 2; armchair_lux 4 7 1; lamp_floor 3 6 0; stereo_lux 13 9 0; ' +
        'counter 20 6 3; fridge 20 7 3; stove 20 8 3; sink_kitchen 20 9 3; counter 16 6 2; coffee 16 6 2; counter 17 6 2; dishwasher 18 6 2; counter 19 6 2; trash_indoor 15 9 1; alarm_smoke 17 6 2; ' +
        'table_dining_lux 17 12 0; chair_wood 17 13 0; chair_wood 18 13 0; chair_wood 17 11 2; chair_wood 18 11 2; chair_wood 16 12 1; chair_wood 19 12 3; flowers 17 12 0; ' +
        'bed_double_lux 4 2 2; dresser 8 2 3; table_end 3 2 2; lamp_table 3 2 2; ' +
        'bathtub 9 2 2; toilet 13 2 2; sink_bath 12 2 2; mirror 12 2 2; shower 13 4 3; ' +
        'bed_single 20 2 2; desk 15 2 2; computer 15 2 2; chair_office 15 3 0; bookshelf 14 2 1; toybox 17 5 0',
      yard: 'tombstone 3 18 2; tombstone 5 18 2; tombstone 7 18 2; tree_maple 1 17 0; tree_maple 22 17 0; tree_pine 1 20 0; tree_pine 22 20 0; bush 9 17 0; bush 13 17 0; lamp_garden 10 19 0; telescope 17 19 0; bench_park 15 20 0; flowerbed 19 17 0'
    },
    villa: {
      w: 26, d: 22, ext: 'stucco', roof: '#a85a3a', front: [8, 14], value: 70000,
      rooms: [[3, 7, 10, 7, 'marble', 'paint_white'], [13, 7, 5, 7, 'tile_white', 'paint_white'], [18, 7, 5, 7, 'wood_light', 'paint_cream'], [3, 2, 6, 5, 'carpet_beige', 'paint_blue'],
        [9, 2, 4, 5, 'marble', 'tile_blue'], [13, 2, 5, 5, 'carpet_red', 'paint_pink'], [18, 2, 5, 5, 'wood_dark', 'wood_panel']],
      doors: 'h 8 14 door_glass; v 13 10 arch; v 18 10 arch; h 5 7 door_white; h 10 7 door_white; h 15 7 door_white; h 20 7 door_wood',
      objs: 'sofa_mid 4 13 0; rug_big 4 10 0; table_coffee 4 11 0; tv_lux 4 9 2; armchair_lux 7 10 3; stereo_lux 12 13 3; sculpture 11 8 0; plant_big 3 7 0; guitar 12 8 3; easel 9 12 0; ' +
        'fridge_lux 13 13 0; stove_lux 14 13 0; counter_granite 15 13 0; sink_kitchen 16 13 0; counter_granite 17 13 0; coffee 15 13 0; dishwasher 17 12 3; trash_indoor 13 8 1; alarm_smoke 14 13 0; ' +
        'table_dining 19 10 0; chair_wood 19 11 0; chair_wood 20 11 0; chair_wood 19 9 2; chair_wood 20 9 2; chair_wood 21 10 3; flowers 19 10 0; ' +
        'bed_double_lux 4 2 2; dresser 8 2 3; table_end 3 2 2; lamp_table 3 2 2; ' +
        'bathtub 9 2 2; toilet_lux 12 2 2; sink_bath 11 2 2; mirror 11 2 2; shower 12 5 3; ' +
        'bed_single_mid 13 2 2; easel 17 2 2; stereo 16 2 2; dresser 17 5 3; ' +
        'desk_lux 19 2 2; computer_lux 19 2 2; chair_office 19 3 0; bookshelf 22 2 3; treadmill 22 4 0',
      yard: 'lamp_garden 7 16 0; lamp_garden 10 16 0; flowerbed 5 15 0; flowerbed 11 15 0; tree_palm 2 16 0; tree_palm 23 16 0; tree_palm 1 3 0; grill 20 17 0; bench_park 15 18 0; sculpture 17 15 0; flamingo 13 19 0'
    },
    gym: {
      w: 13, d: 13, ext: 'brick', roof: '#4a4a52', front: [8, 10], public: true,
      rooms: [[1, 1, 11, 6, 'carpet_blue', 'paint_white'], [1, 7, 4, 3, 'tile_white', 'tile_bath'], [5, 7, 7, 3, 'linoleum', 'paint_cream']],
      doors: 'h 8 10 door_glass; h 8 7 arch; v 5 8 door_white',
      objs: 'treadmill 2 1 2; treadmill 4 1 2; treadmill 6 1 2; weights 9 1 2; weights 11 1 2; tv_mid 11 5 3; toilet 1 7 2; shower 2 7 2; shower 3 7 2; sink_bath 4 9 3; armchair 6 9 0; armchair 7 9 0; plant_big 11 9 0; drink_fountain 11 7 3',
      yard: 'tree_small 0 11 0; bush 12 11 0; flowerbed 6 11 0; flowerbed 10 11 0'
    },
    library: {
      w: 13, d: 13, ext: 'brick', roof: '#5a3a2a', front: [8, 10], public: true,
      rooms: [[1, 1, 11, 6, 'carpet_red', 'wood_panel'], [1, 7, 3, 3, 'tile_white', 'tile_bath'], [4, 7, 8, 3, 'wood_dark', 'wainscot']],
      doors: 'h 8 10 door_glass; h 8 7 arch; v 4 8 door_white',
      objs: 'bookshelf 1 1 2; bookshelf 2 1 2; bookshelf 3 1 2; bookshelf_lux 4 1 2; bookshelf 6 1 2; bookshelf 7 1 2; bookshelf 11 2 3; bookshelf 11 3 3; desk 2 4 0; computer 2 4 0; chair_office 2 3 2; desk 5 4 0; computer 5 4 0; chair_office 5 3 2; chess 8 4 0; armchair_lux 1 6 1; toilet 1 7 2; sink_bath 1 9 1; plant_big 11 9 0; armchair 6 9 0; armchair 7 9 0; drink_fountain 11 7 3',
      yard: 'tree_small 1 11 0; bush 12 11 0; flowerbed 6 11 0; bench_park 9 11 0'
    },
    restroom: {
      w: 6, d: 5, ext: 'brick', roof: '#4a4a52', front: [2, 4], public: true,
      rooms: [[1, 1, 4, 3, 'tile_white', 'tile_bath']],
      doors: 'h 2 4 door_white',
      objs: 'toilet 1 1 2; toilet 4 1 2; sink_bath 2 1 2; sink_bath 3 1 2',
      yard: ''
    }
  };

  function parseList(str) {
    const out = [];
    for (const part of String(str || '').split(';')) {
      const p = part.trim().split(/\s+/);
      if (!p[0]) continue;
      out.push(p);
    }
    return out;
  }

  Object.assign(S, { BLUEPRINTS, parseList });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
