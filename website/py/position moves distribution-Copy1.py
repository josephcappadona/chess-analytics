# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: light
#       format_version: '1.5'
#       jupytext_version: 1.9.1
#   kernelspec:
#     display_name: chess-analytics venv
#     language: python
#     name: venv
# ---

# # Installs & Imports

# !python --version # requires 3.8+

# + colab={"base_uri": "https://localhost:8080/"} id="faSONRmSFmMs" outputId="e0b18a53-4390-4b05-9bdb-1c54fa1ce448"
# !pip install -q wget chess seaborn numpy pandas
# -

# !pip install pydot networkx graphviz

# ## Download the games

from utils import sanitize_url
from download import download
from pathlib import Path

# +
#URL = 'https://lichess.org/games/export/seaghost27?max=100'
URL = 'https://lichess.org/games/export/DrNykterstein?max=500'
#URL = 'https://database.lichess.org/standard/lichess_db_standard_rated_2015-02.pgn.bz2'
URL = None
FILENAME = '../../chess365_d35.pgn'

if URL:    
    filename = sanitize_url(URL)
    pgn_filename = download(URL, filename)
    
else:
    pgn_filename = FILENAME
    
print(pgn_filename)
# -

# ## Build the trie

from game import games_generator_from_file, get_board_for_moves, build_move_df
from trie import make_game_trie, count_trie, filter_trie, get_sub_trie

# +
MAX_GAMES = 200

games_gen = games_generator_from_file(pgn_filename, max_games=MAX_GAMES, sample=0.1, print_every=100)
trie = make_game_trie(games_gen)
print(count_trie(trie))

# +
#LINE = ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', ]  # open sicilian
LINE = ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6']  #
WHITE = None
BLACK = None

(BOARD := get_board_for_moves(LINE))

# +
filtered_trie = filter_trie(trie,
                            moves=LINE,
                            white=WHITE,
                            black=BLACK)

line_trie = get_sub_trie(filtered_trie, LINE)
move_df = build_move_df(line_trie)
print(len(move_df))
# -

# ## Statistics

from statistics import get_count_df
from utils import round_nearest

get_count_df(move_df,
             by='year',
             bin_width=1,
             map_fn=lambda df: round_nearest(df['year'] + (df['month']/12).round(1), 1))

# ## Visualizing

from IPython.core.display import display, HTML
from cairosvg import svg2png
from report import generate_report

N = 5
ELO_BIN_WIDTH = 400
YEAR_BIN_WIDTH = 1

# +
top_moves = move_df['move'].value_counts().iloc[:N].index.values.tolist()
print(top_moves)

top_moves_df = move_df[move_df['move'].isin(top_moves)]
# -

LINE

BOARD; svg2png(bytestring=BOARD._repr_svg_(), write_to='board.png')

# ### Moves by ELO and year

elo_report_html = generate_report(top_moves_df, var='avg_elo');
year_report_html = lambda x: x.split(' ')

display(HTML(elo_report_html))

# +
#display(HTML(year_report_html))
# -

# ## Analysis

# ### Get most commons lines from starting position

from collections import namedtuple
import pandas as pd
import numpy as np
import networkx as nx
from analysis import get_top_lines

# +
M = 20
D = 3

top_lines = get_top_lines(line_trie, max_depth=D)[:M]
top_lines_df = pd.DataFrame(line._asdict() for line in top_lines)

accum_prob = sum(l.score for l in top_lines)
print(f"{M} lines make up {accum_prob*100:.1f}% of the lines starting from {LINE}")
for line in top_lines:
    print(f"\t{np.round(line.score, 5)} {line.moves} {np.round(line.freqs, 3).tolist()} {line.counts}")
# -

# ### AlphaZero Analysis

az_games_gen = games_generator_from_file('../../alphazero_220.pgn', print_every=100)
az_trie = make_game_trie(az_games_gen)
print(count_trie(az_trie))

# #### Find all games where a6 was played by white

count_trie(filter_trie(az_trie, white_moves={'a6'}))

# ### Garry Kasparov Analysis

# +
from game import get_board_for_moves, get_boards_for_moves, get_FEN_to_games

def find_move_orders_reaching_fen(games, fen):
    move_orders = set()
    for game in games:
        for moves, board in get_boards_for_moves(game['moves']):
            if board.fen() == fen:
                move_orders.add(tuple(moves))
    return move_orders


# -

qgd_fen = get_board_for_moves(['d4', 'd5', 'c4', 'e6',]).fen()
e4_e5_fen = get_board_for_moves(['e4', 'e5', ]).fen()
d4_Nf6_fen = get_board_for_moves(['d4', 'Nf6', ]).fen()

# ### Garry Kasparov Analysis

gk_games = list(games_generator_from_file('../../Garry_Kasparov.pgn', print_every=100, max_games=400))

# +
#gk_FEN_to_games = get_FEN_to_games(gk_games)

# +
#find_move_orders_reaching_fen(gk_games, qgd_fen)

# +
gk_trie = make_game_trie(gk_games)
gk_top_lines = get_top_lines(gk_trie, max_depth=D)[:M]
gk_top_lines_df = pd.DataFrame(line._asdict() for line in gk_top_lines)

#accum_prob = sum(l.score for l in gk_top_lines)
#print(f"{M} lines make up {accum_prob*100:.1f}% of the lines starting from {[]}")
#for line in gk_top_lines:
#    print(f"\t{np.round(line.score, 5)} {line.moves} {np.round(line.freqs, 5).tolist()} {line.counts}")

# +
#top_positions = sorted([(len(gk_FEN_to_games[fen]), fen) for fen in gk_FEN_to_games], reverse=True)[:20]
# -

# ### Accelerated Dragon Analysis

from chess import Board
import matplotlib.image as mpimg
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx
import pydot
from networkx.drawing.nx_pydot import graphviz_layout
from collections import namedtuple, defaultdict
plt.rcParams['axes.facecolor'] = 'white'

ad_games = list(games_generator_from_file('../../accel_drag_yugoslav.pgn'))
ad_trie = make_game_trie(ad_games)
ad_lines = get_top_lines(gk_trie, max_depth=50)

ad_lines=ad_top_lines


# +
def graph_from_lines(lines):
    V, E = {}, []
    
    for depth, score, moves, freqs, counts in lines:
        prev_fen = None
        boards = [b for _, b in get_boards_for_moves(moves)]
        for i, (move, board) in enumerate(zip(moves, boards)):
            fen = board.fen()
            if fen not in V:
                V[fen] = len(V)
            if i > 0:
                E.append((V[prev_fen], V[fen]))
            prev_fen = fen
    return V, E
    

V, E = graph_from_lines(ad_lines)

G = nx.Graph()
for v in V:
    svg2png(bytestring=Board(v)._repr_svg_(), write_to='temp.png')
    G.add_node(V[v], image=mpimg.imread('temp.png'), size=1)
for e1, e2 in E:
    G.add_edge(e1, e2, weight=10)
weights = [G[u][v]['weight'] for u,v in E]
pos = graphviz_layout(G, prog='dot')
#labels = {idx:f"{l}" for l, idx in V.items()}
#color_map = ['white']*len(labels)

# +
ax=plt.gca()
fig=plt.gcf()
fig.set_size_inches(12, 12)
fig.set_dpi(50)
nx.draw_networkx(G, pos, ax=ax, width=weights)

#plt.xlim(-1.5,1.5)
#plt.ylim(-1.5,1.5)

trans=ax.transData.transform
trans2=fig.transFigure.inverted().transform

piesize=0.01 #this is the image size
p2=piesize/2.0
for n in G:
    xx,yy=trans(pos[n]) # figure coordinates
    xa,ya=trans2((xx,yy)) # axes coordinates
    a = plt.axes([xa-p2,ya-p2, piesize, piesize])
    a.imshow(G.nodes()[n]['image'])
    a.set_aspect('equal')
    a.axis('off')
ax.axis('off')
plt.show()
# -


