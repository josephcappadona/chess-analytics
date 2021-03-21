from pathlib import Path
import numpy as np
import time
import base64, io

def sanitize_url(url):
    return Path(url).name.translate(dict.fromkeys(map(ord, '?='), '_'))

def round_nearest(x, n):
    return np.round(np.array(x) / n).astype(int) * n

def time_profile(fn):
    def new_fn(*args, **kwargs):
        start_t = time.time()
        ret = fn(*args, **kwargs)
        end_t = time.time()
        print(f'{fn.__name__} took {end_t - start_t:.2f}s')
        return ret
    return new_fn

def encode_image(img):
    buffer = io.BytesIO()
    img.savefig(buffer,  format='png')
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read())
    return encoded.decode("utf-8").replace("\n", "")

class EmptyTrieError(Exception):
    pass