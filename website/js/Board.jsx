import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import 'react-dropdown/style.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chessboard from 'react-simple-chessboard';
import useChess from 'react-chess.js';
import Collapse from '@material-ui/core/Collapse';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
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
            display: 'flex',
        },
        boardControl: {
            width: 500,
            flex: 0,
        },
        collapseHeader: {
            height: 80,
        },
        nextMoves: {
            paddingLeft: 20,
        },
        nextMovesList: {
            paddingTop: 0,
            paddingBottom: 0,
        },
        chessboard: {
            width: 500,
            height: 500,
        },
      });
    const classes = useStyles();
    const { onChange, sessionID, PGN } = props;

    const [state, setState] = React.useState({
        nextMovesLoading: false,
        nextMovesResponse: "",
        nextMovesExpanded: true,
        nextMoves: [],
        firstMove: "",
        history: [],
        curGames: [],
    });

    const {
        nextMovesLoading,
        nextMovesResponse,
        nextMovesExpanded,
        nextMoves,
        firstMove,
        history,
        curGames,
    } = state;

    var getNextMoves = function(moves) {
        
        const action = 'get-moves';
        const json = JSON.stringify({ sessionID, action, moves });
        console.log(sessionID, action, moves);
        const params = {
            headers: {'Content-Type': 'application/json'}
        };
        setState(prevState => { return { ...prevState, nextMovesLoading: true }; });
        axios.post(HOST + '/api/analysis', json, params)
            .then(response => {
                console.log('response.data.message', response.data.message);
                setState(prevState => {
                    return {
                        ...prevState,
                        nextMovesLoading: false,
                        nextMovesResponse: response.data.message
                    };
                });
                if (response.data.nextMoves !== undefined) {
                    setState(prevState => {
                        return {
                            ...prevState,
                            nextMoves: response.data.nextMoves,
                            firstMove: response.data.nextMoves[0],
                            curGames: response.data.curGames,
                        };
                    });
                }
        });
    };

    useEffect(() => {
        const newHistory = [];
        reset();
        setState(prevState => { return { ...prevState, history: newHistory }; });
        getNextMoves(newHistory);
    }, []);
    
    var handleMove = function(nextMove) {

        const newHistory = [...history, nextMove];

        move(nextMove);
        setState(prevState => { return { ...prevState, history: newHistory }; });

        getNextMoves(newHistory);
        onChange(newHistory);
    };

    var MoveButton = function({ move }) {
        const handleClick = function(event) {
            handleMove(move);
        };
        return (
            <Button disabled={nextMovesLoading} onClick={handleClick}>{move}</Button>
        )
    };

    var handleUndo = function() {
        const newNextMove = history[history.length - 1];
        const newHistory = history.slice(0, history.length-1);

        undo();
        
        setState(prevState => { return { ...prevState, history: newHistory }; });
        getNextMoves(newHistory);

        onChange(newHistory);
    }

    var handleReset = function() {
        const newHistory = [];

        reset();

        setState(prevState => { return { ...prevState, history: newHistory }; });
        getNextMoves(newHistory);
        
        onChange(newHistory);
    }

    const onCollapseClick = function() {
        setState(prevState => { return { ...prevState, nextMovesExpanded: !nextMovesExpanded }; });
    }

    return (
        <div className={classes.boardRoot}>
            {/* BOARD CONTROL  setNextMovesExpanded*/}
            <Col className={classes.boardControl}>
                <div className={classes.chessboard} >
                    <Chessboard position={fen} />
                </div>
                <Row>
                    <Button disabled={nextMovesLoading || nextMoves === []} onClick={() => {handleMove(firstMove);}}>Move</Button>
                    <Button disabled={nextMovesLoading} onClick={handleUndo}>Undo</Button>
                    <Button disabled={nextMovesLoading} onClick={handleReset}>Reset</Button>
                </Row>
            </Col>

            {/** NEXT MOVES */}
            <div className={classes.nextMoves}>
                <List className={classes.nextMovesList}>
                    <ListItem className={classes.collapseHeader} button onClick={onCollapseClick}>
                        <Spinner hidden={!nextMovesLoading} animation="border" role="status">
                            <span className="sr-only">Loading...</span></Spinner>
                        <ListItemText>{nextMovesResponse}</ListItemText>
                        <ListItemIcon>{nextMovesExpanded ? <ExpandMore /> : <ExpandLess />}</ListItemIcon>
                    </ListItem>
                    
                    <Collapse in={nextMovesExpanded} timeout="auto">
                        <List>
                            {nextMoves === undefined ? '' : nextMoves.map(move => <ListItem><MoveButton move={move} /></ListItem>)}
                            {curGames === undefined ? '' : curGames.map(game => <ListItem>{JSON.stringify(game)}</ListItem>)}
                        </List>
                    </Collapse>
                </List>
            </div>
        </div>
    )
}