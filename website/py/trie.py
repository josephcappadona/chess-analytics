from .utils import time_profile


@time_profile
def make_game_trie(games, root=None):
    root = root or dict()
    for game in games:
        current_dict = root
        for move in game['moves']:
            current_dict = current_dict.setdefault(move, {})
        if None not in current_dict:
            current_dict[None] = []
        current_dict[None].append(game)
    return root

def in_trie(trie, moves):
    current_dict = trie
    for move in moves:
        if move not in current_dict:
            return False
        current_dict = current_dict[move]
    return True

def get_sub_trie(trie, moves):
    current_dict = trie
    for move in moves:
        if move not in current_dict:
            return None
        current_dict = current_dict[move]
    return current_dict

def count_trie(trie):
    if isinstance(trie, list):
        return len(trie)
    else:
        count = 0
        for move, sub_trie in trie.items():
            count += count_trie(sub_trie)
        return count

def get_leaves(trie):
    leaves = []
    if isinstance(trie, list):
        for game in trie:
            yield game
    elif isinstance(trie, dict):
        for move, sub_trie in trie.items():
            for game in get_leaves(sub_trie):
                yield game

def filter_games(games,
                 white=None,
                 black=None,
                 min_elo=0,
                 max_elo=4000,
                 require_elo=False,
                 moves=None,
                 white_moves=None,
                 black_moves=None,
                 time_control=None):
    filtered = []
    for game in games:
        valid = True
        if white and game['White'] != white:
            valid = False
        elif black and game['Black'] != black:
            valid = False
        elif require_elo and not (min_elo < int(game['WhiteElo']) < max_elo):
            valid = False
        elif require_elo and not (min_elo < int(game['BlackElo']) < max_elo):
            valid = False
        elif moves and moves != game['moves'][:len(moves)]:
            valid = False
        elif white_moves and white_moves.intersection(set(game['moves'][::2])) != white_moves:
            valid = False
        elif black_moves and black_moves.intersection(set(game['moves'][1::2])) != black_moves:
            valid = False
        elif time_control and game['TimeControl'] != time_control:
            valid = False
        if valid:
            filtered.append(game)
    return filtered

def filter_trie(trie, **kwargs):
    new_trie = {}
    
    for move, sub_trie in trie.items():
        if move == None or isinstance(sub_trie, list):
            new_trie[move] = filter_games(sub_trie, **kwargs)
        else:
            new_trie[move] = filter_trie(sub_trie, **kwargs)
    return new_trie


if __name__ == '__main__':

    from .game import games_generator_from_file
    from .trie import make_game_trie, count_trie
    import json, argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('PGN_FILENAME', type=str, help="the .pgn file to load in")
    parser.add_argument('-m', "--MAX_GAMES", type=int, help="max number of moves to extract", default=None)
    parser.add_argument('-s', "--SAMPLE", type=float, help="the frequency with which to sample games", default=1.0)
    parser.add_argument('-p', "--PRINT_EVERY", type=int, help="how often to log game number", default=100)
    args = parser.parse_args()


    games_gen = games_generator_from_file(args.PGN_FILENAME,
                                          max_games=args.MAX_GAMES,
                                          sample=args.SAMPLE,
                                          print_every=args.PRINT_EVERY)
    trie = make_game_trie(games_gen)
    print(count_trie(trie))

    with open(trie_filename := f'{args.PGN_FILENAME}.trie.json', 'w+') as trie_file:
        json.dump(trie, trie_file)
        print(f"Wrote {trie_filename}")