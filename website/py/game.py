from chess import pgn
import numpy as np
import pandas as pd
from collections import defaultdict
from .trie import get_leaves
from .utils import EmptyTrieError


def get_avg_elo(game):
    white_elo = game.headers.get('WhiteElo', '')
    black_elo = game.headers.get('BlackElo', '')
    if white_elo and black_elo and \
        not white_elo.endswith('?') and not black_elo.endswith('?'):
        
        avg_elo = (int(white_elo) + int(black_elo)) / 2
        return avg_elo
    elif white_elo and not white_elo.endswith('?'):
        return int(white_elo)
    elif black_elo and not black_elo.endswith('?'):
        return int(black_elo)
    else:
        return None

def get_moves(game):
    return [move.san() for move in game.mainline()]

def get_board_for_moves(moves):
    g = pgn.Game()
    for move in moves:
        new_move = g.end().board().push_san(move)
        g.end().add_main_variation(new_move)
        g = g.next()
    return g.board()

def get_boards_for_moves(moves):
    g = pgn.Game()
    yield [], g.board()
    moves_ = []
    for move in moves:
        new_move = g.end().board().push_san(move)
        g.end().add_main_variation(new_move)
        g = g.next()
        moves_.append(move)
        yield moves_, g.board()

def get_moves_generator(game):
    for move in game.mainline():
        yield move.san()

def games_generator_from_file(filename,
                              max_games=None,
                              sample=1.0,
                              print_every=500):
    
    pgn_file = open(filename, encoding='ISO-8859-1')
    count = 0
    game = pgn.read_game(pgn_file)
    while game:
        if np.random.random() < sample:
            try:
                game_dict = dict(game.headers)
                game_dict['moves'] = get_moves(game)
                if (date := game_dict.get('UTCDate', None)) or (date := game_dict.get('Date', None)):
                    year, month, day = date.split('.')
                    game_dict['year'] = int(year) if '?' not in year else None
                    game_dict['month'] = int(month) if '?' not in month else 0
                    game_dict['day'] = int(day) if '?' not in day else 0
                game_dict['avg_elo'] = get_avg_elo(game)
                yield game_dict
                
                if (count % print_every) == 0:
                    print(count)
                count += 1
            except ValueError as err:
                print(err)

            if max_games and count >= max_games:
                break
        
        game = pgn.read_game(pgn_file)

def get_move_to_games_mapping(trie, elo_min=0, elo_max=float('inf')):
    move_to_games = {}
    try:
        for move, sub_trie in trie.items():
            games = list(get_leaves(sub_trie))
            move_to_games[move] = games
    except AttributeError:
        raise EmptyTrieError('No games in trie.')

    return move_to_games

def get_FEN_to_games(games):
    FEN_to_games = defaultdict(list)
    for game in games:
        for _, board in get_boards_for_moves(game['moves']):
            FEN_to_games[board.fen()].append(game)
    return FEN_to_games

def build_move_df(trie, **kwargs):
    data = []
    move_to_games = get_move_to_games_mapping(trie, *kwargs)
    for move, games in move_to_games.items():
        for game in games:
            game = game.copy()
            game['move'] = move
            data.append(game)

    move_df = pd.DataFrame(data)
    return move_df

def get_elo_to_move_mapping(trie, bin_width=200):
    elo_to_move = defaultdict(list)

    for move, sub_trie in trie.items():
        for game in get_leaves(sub_trie):
            elo = game['avg_elo']
            rounded_elo = round_nearest(elo, bin_width)
            elo_to_move[rounded_elo].append(move)
            
    return elo_to_move