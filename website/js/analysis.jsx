import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import 'react-dropdown/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Upload } from '../js/Upload.jsx';
import { Board } from '../js/Board.jsx';
import { TopLines } from '../js/TopLines.jsx';


import { makeStyles } from "@material-ui/core/styles";
const useStyles = makeStyles({
    root: {
        minWidth: 600,
    },
    loadPGN: {

    },
    findPosition: {

    },
    topLineAnalyze: {

    },
    lineScore: {
        width: 100,
        height: 100,
        fontSize: 20,
    },
    topLineMove: {
        width: 100,
        height: 100,
        margin: 10,
    },
    topLineMoveText: {
        fontSize: 16,
        margin: 'auto',
    },
    topLine: {
        height: 100,
        margin: 15,
    }
  });

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function AnalysisApp(props) {
    const classes = useStyles();
    const [sessionID, setSessionID] = React.useState(String(Date.now() + getRandomInt(10**12)));

    const [PGN, setPGN] = React.useState("");
    const [PGNLoaded, setPGNLoaded] = React.useState(false);

    const [moves, setMoves] = React.useState([]);


    var onPGNLoad = function(data) {
        setPGN(data.PGN);
        setPGNLoaded(true);
    };

    var onBoardChange = function(newMoves) {
        setMoves(newMoves);
    }

    return (
        <div className={classes.root}>
            <h2>Chess Position Analysis</h2>

            <h3>Step 1 - Load PGN</h3>
            <Upload
                sessionID={sessionID}
                className={classes.loadPGN}
                onLoad={onPGNLoad}
            />
            
            <h3>Step 2 - Find a position</h3>
            {PGNLoaded ? <Board
                className={classes.findPosition}
                sessionID={sessionID}
                PGN={PGN}
                onChange={onBoardChange}
            /> : <div>Not ready</div>}


            <h3>Step 3 - Analyze</h3>
            {/* TOP LINES */}
            {PGNLoaded ? <TopLines 
                className={classes.topLineAnalyze}
                sessionID={sessionID}
                moves={moves}
            /> : <div>STILL not ready</div>}
        </div>
    );
}


ReactDOM.render(<AnalysisApp />, document.getElementById('analysis-app'));
