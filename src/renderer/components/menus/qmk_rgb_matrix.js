export const qmk_rgb_matrix = [
    {
        label: 'Lighting',
        content: [
            {
                label: 'Backlight',
                content: [
                    {
                        label: 'rgbEffect',
                        type: 'dropdown',
                        content: ['id_qmk_rgb_matrix_effect', 3, 2],
                        options: [
                            'All Off',
                            'Solid Color',
                            'Alphas Mods',
                            'Gradient Up/Down',
                            'Gradient Left/Right',
                            'Breathing',
                            'Band Sat.',
                            'Band Val.',
                            'Pinwheel Sat.',
                            'Pinwheel Val.',
                            'Spiral Sat.',
                            'Spiral Val.',
                            'Cycle All',
                            'Cycle Left/Right',
                            'Cycle Up/Down',
                            'Rainbow Moving Chevron',
                            'Cycle Out/In',
                            'Cycle Out/In Dual',
                            'Cycle Pinwheel',
                            'Cycle Spiral',
                            'Dual Beacon',
                            'Rainbow Beacon',
                            'Rainbow Pinwheels',
                            'Raindrops',
                            'Jellybean Raindrops',
                            'Hue Breathing',
                            'Hue Pendulum',
                            'Hue Wave',
                            'Pixel Rain',
                            'Pixel Flow',
                            'Pixel Fractal',
                            'Typing Heatmap',
                            'Digital Rain',
                            'Solid Reactive Simple',
                            'Solid Reactive',
                            'Solid Reactive Wide',
                            'Solid Reactive Multi Wide',
                            'Solid Reactive Cross',
                            'Solid Reactive Multi Cross',
                            'Solid Reactive Nexus',
                            'Solid Reactive Multi Nexus',
                            'Spash',
                            'Multi Splash',
                            'Solid Splash',
                            'Solid Multi Splash',
                        ],
                    },
                    {
                        label: 'rgbBrightness',
                        type: 'range',
                        options: [0, 255],
                        content: ['id_qmk_rgb_matrix_brightness', 3, 1],
                    },
                    {
                        showIf: 'v3MenuProp.id_qmk_rgb_matrix_effect != 0',
                        label: 'rgbRate',
                        type: 'range',
                        options: [0, 255],
                        content: ['id_qmk_rgb_matrix_effect_speed', 3, 3],
                    },
                    {
                        showIf: 'v3MenuProp.id_qmk_rgb_matrix_effect != 0 && v3MenuProp.id_qmk_rgb_matrix_effect != 24 && v3MenuProp.id_qmk_rgb_matrix_effect != 28 && v3MenuProp.id_qmk_rgb_matrix_effect != 29 && v3MenuProp.id_qmk_rgb_matrix_effect != 32',
                        label: 'rgbColor',
                        type: 'color',
                        content: ['id_qmk_rgb_matrix_color', 3, 4],
                    },
                ],
            },
        ],
    },
];