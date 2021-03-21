import pandas as pd
from .utils import round_nearest

def get_count_df(move_df, by=None, bin_width=10, map_fn=None):
    move_df = move_df.copy()
    if map_fn:
        move_df[by] = map_fn(move_df)
    move_df[by] = round_nearest(move_df[by], bin_width)
    group_df = move_df.groupby([by, 'move']).size().reset_index().rename(columns={0: 'count'})
    return pd.crosstab(group_df[by], group_df['move'], group_df['count'], aggfunc=sum).fillna(0)

def normalize(d, target=1.0):
    raw = sum(d.values())
    factor = target / raw
    return {key:value*factor for key,value in d.items()}