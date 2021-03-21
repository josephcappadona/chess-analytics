import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/common.css';
import '../css/analysis.css';
import Chessboard from 'react-simple-chessboard';
import useChess from 'react-chess.js';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

const axios = require('axios').default;
const fs = require('fs').default;

const HOST = 'http://' + window.location.host;

import { makeStyles } from "@material-ui/core/styles";

export const Board = function(props) { 
    const { move, fen, reset, undo } = useChess();

    const useStyles = makeStyles({
        boardRoot: {
            width: 1200,
            minHeight: 600,
        },
        collapseHeader: {
            height: 80,
        },
        nextMoves: {
            width: 600,
        },
        chessboard: {
            width: 500,
            height: 500,
        },
      });
    const classes = useStyles();
    const { onChange, sessionID, PGN } = props;

    const [nextMovesLoading, setNextMovesLoading] = React.useState(false);
    const [nextMovesResponse, setNextMovesResponse] = React.useState("");
    const [nextMovesExpanded, setNextMovesExpanded] = React.useState(true);
    const [nextMoves, setNextMoves] = React.useState([]);
    const [firstMove, setFirstMove] = React.useState("");
    const [history, setHistory] = React.useState([]);

    var getNextMoves = function(moves) {
        const action = 'get-moves';
        const json = JSON.stringify({ sessionID, action, moves });
        console.log(sessionID, action, moves);
        const params = {
            headers: {'Content-Type': 'application/json'}
        };
        setNextMovesLoading(true);
        axios.post(HOST + '/api/analysis', json, params)
            .then(response => {
                setNextMovesLoading(false);
                setNextMovesResponse(response.data.message);
                if (response.data.nextMoves !== undefined) {
                    setNextMoves(response.data.nextMoves);
                    setFirstMove(response.data.nextMoves[0]);
                }
        });
    };

    useEffect(() => {
        const newHistory = [];
        reset();
        setHistory(newHistory);
        getNextMoves(newHistory);
    }, []);
    
    var handleMove = function(nextMove) {

        const newHistory = [...history, nextMove];

        move(nextMove);
        setHistory(newHistory);

        getNextMoves(newHistory);

        onChange(newHistory);
    };

    var MoveButton = function(props) {
        const move = props.move;
        const handleClick = function(event) {
            handleMove(move);
        }
        return (
            <Button onClick={handleClick}>{move}</Button>
        )
    };

    var handleUndo = function() {
        const newNextMove = history[history.length - 1];
        const newHistory = history.slice(0, history.length-1);

        undo();
        
        setHistory(newHistory);
        getNextMoves(newHistory);

        onChange(newHistory);
    }

    var handleReset = function() {
        const newHistory = [];

        reset();

        setHistory(newHistory);
        getNextMoves(newHistory);
        
        onChange(newHistory);
    }

    const onCollapseClick = function() {
        setNextMovesExpanded(!nextMovesExpanded);
    }

    return (
        <div className={classes.boardRoot}>
            <Row>
                {/** NEXT MOVES */}
                <div className={classes.nextMoves}>
                    <List >
                        <ListItem className={classes.collapseHeader} button onClick={onCollapseClick}>
                            <Spinner hidden={!nextMovesLoading} animation="border" role="status"><span className="sr-only">Loading...</span></Spinner>
                            <ListItemText>{nextMovesResponse}</ListItemText>
                            <ListItemIcon>{nextMovesExpanded ? <ExpandMore /> : <ExpandLess />}</ListItemIcon>
                        </ListItem>
                        
                        <Collapse in={nextMovesExpanded} timeout="auto">
                            <List>
                                {nextMoves === undefined ? '' : nextMoves.map(move => <ListItem><MoveButton move={move} onClick={handleMove} /></ListItem>)}
                            </List>
                        </Collapse>
                    </List>
                </div>

                {/* BOARD CONTROL  setNextMovesExpanded*/}
                <Col>
                    <div className={classes.chessboard} >
                        <Chessboard position={fen} />
                    </div>
                    <Button disabled={nextMovesLoading || nextMoves === []} onClick={() => {handleMove(firstMove);}}>Move</Button>
                    <Button disabled={nextMovesLoading} onClick={handleUndo}>Undo</Button>
                    <Button disabled={nextMovesLoading} onClick={handleReset}>Reset</Button>
                </Col>
            </Row>
        </div>
    )
}