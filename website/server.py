import os
from flask import Flask, render_template, request, abort, jsonify
from pathlib import Path
import pandas as pd
import numpy as np
import json
from pprint import pprint

from py.game import games_generator_from_file
from py.trie import make_game_trie, count_trie, filter_trie, get_sub_trie
from py.analysis import get_top_lines

app = Flask(__name__)

app_cache = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analysis')
def detr():
    return render_template('analysis.html')
    

@app.route('/api/analysis', methods=['POST'])
def api_analysis():
    data = request.json

    if 'sessionID' not in data or 'action' not in data:
        error_code = 401

    else:
        error_code = 201
        session_id = data['sessionID']
        action = data['action']

        if session_id not in app_cache:
            app_cache[session_id] = {}

        if action == 'load':
            ret = {}
        
        elif action == 'get-cached-pgn':
            ret = {}
        
        elif action == 'get-moves':
            ret = {}

        elif action == 'top-lines':
            ret = {}
        
        elif action == 'get-cached-pgn-ids':
            ret = {}

        elif action == 'find-tactics':
            ret = {}

        else:
            ret = {}
    pprint(ret)
    return json.dumps(ret, cls=NpEncoder), error_code


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 3000), debug=True)
