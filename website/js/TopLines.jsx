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
import { makeStyles } from "@material-ui/core/styles";
import { Upload } from '../js/Upload.jsx';
import { Board } from '../js/Board.jsx';

const axios = require('axios').default;
const fs = require('fs').default;

const HOST = 'http://' + window.location.host;


export const TopLines = function(props) {

    const useStyles = makeStyles({
        topLinesRoot: {
            minWidth: 600,
            minHeight: 500,
        },
        topLinesForm: {

        },
        topLinesDisplay: {
            display: 'table',
        },

        formLabel: {
            margin: 'auto 0',
        },
        depthInput: {
            width: 100,
        },
        quantityInput: {
            width: 100,
        },
        inputGroup: {
            display: 'flex',
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
            minHeight: 100,
            minWidth: 600,
            margin: 15,
        },
    });
    const classes = useStyles();

    const { sessionID, moves } = props;

    const [topLines, setTopLines] = React.useState([]);
    const [topLinesLoading, setTopLinesLoading] = React.useState(false);
    const [topLinesResponse, setTopLinesResponse] = React.useState("");
    const [topLinesExpanded, setTopLinesExpanded] = React.useState(true);

    var getTopLines = function(event) {

        event.preventDefault();
        const data = event.target.elements;
        console.log(data);
        const depth = parseInt(data.TopLinesDepth.value);
        const quantity = parseInt(data.TopLinesQuantity.value);

        const action = 'top-lines';
        const json = JSON.stringify({ sessionID, action, moves, depth, quantity });
        console.log(sessionID, action, moves, depth);
        const params = {
            headers: {'Content-Type': 'application/json'}
        };
        setTopLinesLoading(true);
        axios.post(HOST + '/api/analysis', json, params)
            .then(response => {
                setTopLinesLoading(false);
                setTopLinesResponse(response.data.message);
                setTopLines(response.data.topLines);
        });
    };

    var LineScore = function({ score }) {
        return (
            <div className={classes.lineScore}>
                {parseFloat(score*100).toFixed(2)}%
            </div>
        )
    };
    
    var TopLineMove = function({ move, prob, count }) {
        return (
            <div  className={classes.topLineMove}>
                <Col>
                    <Row className={classes.topLineMoveText}>{move}</Row>
                    <Row>p:{parseFloat(prob*100).toFixed(1)}%</Row>
                    <Row>#:{count}</Row>
                </Col>
            </div>
        )
    };

    var TopLine = function({ score, line }) {
        return (
            <Row className={classes.topLine}>
                <LineScore score={score} />
                {line.map((x, i) => {
                    console.log('move', i, x[0], x[1], x[2]);
                    return <TopLineMove move={x[0]} prob={x[1]} count={x[2]} />
                    //return <div>{x}</div>
                })}
            </Row>
        )
    };

    const onCollapseClick = function() {
        setTopLinesExpanded(!topLinesExpanded);
    };

    return (
        <div className={classes.topLinesRoot}>
            <Row>
                
                <Spinner hidden={!topLinesLoading} animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
            </Row>

            <Form className="top-lines-form" noValidate onSubmit={getTopLines}>
                <Form.Group className={classes.inputGroup} controlId="TopLinesDepth">
                    <Form.Label className={classes.formLabel}>Depth</Form.Label>
                    <Form.Control className={classes.depthInput} as="input" type="number" defaultValue={5} />
                </Form.Group>
                <Form.Group className={classes.inputGroup} controlId="TopLinesQuantity">
                    <Form.Label className={classes.formLabel}>Quantity</Form.Label>
                    <Form.Control className={classes.quantityInput} as="input" type="number" defaultValue={5} />
                </Form.Group>
                <Button type="submit" variant="primary">Get Top Lines</Button>
            </Form>
            
            {topLines.length > 0 ?
                <List className={classes.topLinesDisplay} >
                    <ListItem button onClick={onCollapseClick}>
                        <ListItemText >
                            {topLinesResponse}
                        </ListItemText>
                        {topLinesExpanded ? <ExpandMore /> : <ExpandLess />}
                    </ListItem>

                    <Collapse in={topLinesExpanded} timeout="auto" >
                        <List>
            {topLines.map(([score, moves], i) => {
                console.log('moves', moves);
                return <ListItem key={i}><TopLine score={score} line={moves}/></ListItem>
            })}
                        </List>
                    </Collapse>
                    
                </List> : <div>No results yet</div>}
        </div>
    )
}