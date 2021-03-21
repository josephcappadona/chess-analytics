
from .statistics import get_count_df
from .game import build_move_df,  get_board_for_moves
from .trie import filter_trie, get_sub_trie
from .viz import plot_count, plot_dist, plot_violin
from .utils import encode_image

def generate_report(move_df, var=None, bin_width=None, map_fn=None, board_filepath=None, line=None, dist_kwargs={}, violin_kwargs={}):
    df = move_df.dropna(subset=[var])
    
    if var == 'year':
        map_fn = lambda df: df['year'] + (df['month']/12).round(1)
        bin_width = bin_width or 1
        violin_kwargs = {'cut': 0, 'bw': 0.95}
    elif var == 'avg_elo':
        map_fn = None
        bin_width = bin_width or 400
        dist_kwargs = {'binrange': (0, 3200)}
        violin_kwargs = {'cut': 1}
    else:
        raise ValueError(var)

    count_df = get_count_df(df, by=var, bin_width=bin_width, map_fn=map_fn)
    frequency_df = count_df.div(count_df.sum(axis=1), axis=0).round(3)

    count_plot = plot_count(count_df, by=var, bin_width=bin_width)
    distr_plot = plot_dist(df, by=var, bin_width=bin_width, **dist_kwargs)
    violin_plot = plot_violin(df, by=var, **violin_kwargs)
    
    return f"""
        <div style="display:block; width:800px;">
            {f'<div><img src={str(board_filepath)} /></div>' if board_filepath else ''}
            {f'<div>{str(line)}</div>' if line else ''}
            <div style="display:flex">
                <div style="margin:auto;"><img src="data:image/png;base64,{encode_image(count_plot)}" /> </div>
                <div style="margin:auto;">{count_df.to_html()}</div>
            </div>
            <div style="display:flex">
                <div style="margin:auto;"><img src="data:image/png;base64,{encode_image(distr_plot)}" /> </div>
                <div style="margin:auto;">{frequency_df.to_html()}</div>
            </div>
            <div>
                <div><img src="data:image/png;base64,{encode_image(violin_plot)}"/></div>
            </div>
        </div>
    """


if __name__ == '__main__':
    import argparse, json
    from pprint import pprint

    parser = argparse.ArgumentParser()
    parser.add_argument('TRIE_FILENAME', type=str, help="the .trie.json file to load in")
    parser.add_argument('-l', "--LINE", type=lambda x: x.split(' '), help="the line to filter by", default=[])
    parser.add_argument('-w', "--WHITE", type=str, help="the white player to filter by", default=None)
    parser.add_argument('-b', "--BLACK", type=str, help="the black player to filter by", default=None)
    parser.add_argument('-n', "--N", type=int, help="take the top N moves", default=10)
    parser.add_argument('-r', "--REPORT_VARS", type=lambda x: x.split(' '), help="the reports to generate", default=['avg_elo', 'year'])
    parser.add_argument('-bw', "--BIN_WIDTHS", type=lambda x: [int(y) for y in x.split(' ')], help="bin widths for each report, respectively", default=[400, 1])
    parser.add_argument('-wm', "--WHITE_MOVES", type=lambda x: set(x.split(' ')), help="(unordered) moves for white to filter by", default=None)
    parser.add_argument('-bm', "--BLACK_MOVES", type=lambda x: set(x.split(' ')), help="(unordered) moves for white to filter by", default=None)
    parser.add_argument('-f', "--FEN", type=str, help="filter for games that reach this FEN", default=None)
    args = parser.parse_args()

    pprint(args)

    with open(args.TRIE_FILENAME, 'rb') as trie_file:
        trie = json.load(trie_file)
    
    filtered_trie = filter_trie(trie,
                                moves=args.LINE,
                                white=args.WHITE,
                                black=args.BLACK)
    line_trie = get_sub_trie(filtered_trie, args.LINE)
    board = get_board_for_moves(args.LINE)

    move_df = build_move_df(line_trie)

    move_counts = move_df['move'].value_counts()
    top_moves = move_counts.iloc[:args.N].index.values.tolist()

    top_moves_df = move_df[move_df['move'].isin(top_moves)]

    print('Move counts:')
    print(move_counts)

    from pathlib import Path
    import os
    fn_base = args.TRIE_FILENAME[:args.TRIE_FILENAME.index('.pgn')]
    report_dir = Path(f'reports/{fn_base}')
    os.makedirs(report_dir, exist_ok=True)

    from cairosvg import svg2png
    board_filepath = report_dir / 'board.png'
    svg2png(bytestring=board._repr_svg_(), write_to=str(board_filepath))

    for report_var, bin_width in zip(args.REPORT_VARS, args.BIN_WIDTHS):
        print(f"Generating `{report_var}` report with `bin_width={bin_width}`")
        report_html = generate_report(top_moves_df, var=report_var, board_filepath='board.png', line=args.LINE)
        report_var_filename = report_dir / f'{report_var}_report.html'
        with open(report_var_filename, 'w+t') as report_file:
            report_file.write(report_html)
            print(f"Wrote {report_var_filename}")
    
    
