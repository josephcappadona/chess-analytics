import pandas as pd
import seaborn as sns
sns.set_theme(style="whitegrid")
sns.set(rc={'figure.figsize':(8, 5)})
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from .utils import round_nearest

def plot_count(count_df, by=None, bin_width=10, normalize_=False, **kwargs):
    plt.figure()
    
    count_df = count_df.transpose()
    
    stat = 'count'
    if normalize_:
        stat = 'frequency'
        for var in count_df.columns:
            sum_ = sum(count_df[var].values)
            count_df[var] = count_df[var] / sum_
        count_df = count_df.rename(columns={'count': 'frequency'})
        
    count_df['move'] = count_df.index
    melted_df = pd.melt(count_df, id_vars='move', var_name=by, value_name=stat)
    g = sns.catplot(x=by,
                    y=stat,
                    hue='move',
                    kind='bar',
                    legend=True,
                    data=melted_df,
                    **kwargs)
    return g

def plot_dist(move_df, by=None, bin_width=10, fmt_fn=True, **kwargs):
    fig, ax = plt.subplots()
    
    if by == 'year':
        move_df = move_df.copy()
        move_df['year'] = round_nearest(move_df['year'].values + (move_df['month'].values / 12).round(1), bin_width)
    
    g = sns.histplot(ax=ax,
                     x=by,
                     y=None,
                     hue='move',
                     binwidth=bin_width,
                     stat='frequency',
                     multiple='fill',
                     legend=True,
                     data=move_df,
                     **kwargs)
    if fmt_fn:
        g.get_xaxis().set_minor_formatter(ticker.FuncFormatter(lambda x, pos: f'{x:g}'))
        g.get_xaxis().set_major_formatter(ticker.FuncFormatter(lambda x, pos: f'{x:g}'))
    return fig

def plot_violin(move_df, by=None, **kwargs):
    fig, ax = plt.subplots()
    _ = sns.violinplot(ax=ax,
                       x=by,
                       y='move',
                       data=move_df,
                       scale='count',
                       **kwargs)
    return fig