
export const FIGURES = [
    [[0, 0, 1], [1, 1, 1]],
    [[0, 2, 2], [2, 2, 0]],
    [[3, 3, 3, 3]],
    [[4, 4], [4, 4]],
    [[5, 5, 0], [0, 5, 5]],
    [[6, 0, 0], [6, 6, 6]]

]

export const randomFigure = () => FIGURES[Math.floor(Math.random() * FIGURES.length)]