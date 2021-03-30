from collections import namedtuple

from .game import build_move_df

def get_top_lines(trie, max_depth=6):
    
    Line = namedtuple('Line', ['depth', 'score', 'moves', 'freqs', 'counts'])
    
    move_df = build_move_df(trie)
    counts = move_df['move'].value_counts()
    frequencies = counts / len(move_df)
    
    lines = []
    for move, sub_trie in trie.items():
        
        if max_depth == 1 and move is not None:
            score = freq = frequencies[move]
            count = counts[move]
            lines.append(Line(1, score, [move], [freq], [count]))
        else:
            if isinstance(sub_trie, dict):
                top_sub_lines = get_top_lines(sub_trie, max_depth=max_depth-1)
                for _, score, sub_line, freqs, counts_ in top_sub_lines:
                    freq = frequencies[move]
                    count = counts[move]
                    score = score * freq
                    lines.append(Line(len(sub_line)+1, score, [move] + sub_line, [freq] + freqs, [count] + counts_))
            elif move is None and isinstance(sub_trie, list):
                lines.append(Line(0, 1, [], [], []))
                
    return sorted(lines, reverse=True)