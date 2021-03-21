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

export const Upload = function(props) { 
    const useStyles = makeStyles({
        uploadRoot: {
            width: 750,
        },
        uploadPGN: {
            width: 450
        },
        cachedPGN: {
            width: 450
        },
        cacheDropdown: {
            width: '100%',
        },
      });
    const classes = useStyles();

    const [state, setState] = React.useState({
        onLoad: props.onLoad,
        sessionID: props.sessionID,

        PGN: "",
        PGNUploaded: false,
        uploadedPGNFilename: null,
        cachedPGNFilename: null,
        cachedPGNFilenames: [],
        PGNLoading: false,
        cachedPGNLoading: false,
        cachedPGNFilenamesLoading: false,
        PGNLoaded: false,
        response: "",
        startResponse: "",
    });

    const {
        onLoad,
        sessionID,
        PGN,
        PGNUploaded,
        uploadedPGNFilename,
        cachedPGNFilename,
        cachedPGNFilenames,
        PGNLoading,
        cachedPGNLoading,
        cachedPGNFilenamesLoading,
        PGNLoaded,
        response,
        startResponse,
    } = state;

    var getCachedPGNIDs = function() {

        const action = 'get-cached-pgn-ids';
        const json = JSON.stringify({ sessionID, action });
        console.log(sessionID, action);
        const params = { headers: {'Content-Type': 'application/json'} };
        setState({ ...state, cachedPGNFilenamesLoading: true });
        axios.post(HOST + '/api/analysis', json, params)
            .then(response => {
                setState({
                    ...state,
                    cachedPGNFilenamesLoading: false,
                    cachedPGNFilenames: response.data.PGNFilenames,
                })
        });
    };
    useEffect(() => {
        getCachedPGNIDs();
    }, []);

    var getCachedPGN = function(pgn_filename) {

        const action = 'get-cached-pgn';
        const json = JSON.stringify({ sessionID, action, cachedPGNFilename });
        console.log(sessionID, action);
        const params = {
            headers: {'Content-Type': 'application/json'}
        };
        setState({ ...state, cachedPGNLoading: true });
        axios.post(HOST + '/api/analysis', json, params)
            .then(response => {

                const data = response.data;

                setState({
                    ...state,
                    cachedPGNLoading: false,
                    PGN: data.PGN,
                    startResponse: data.message,
                    PGNLoaded: true,
                });
                
                onLoad(data);
        });
    };


    var uploadFile = function(event) {
        const files = event.target.files;

        var read = new FileReader();
        read.onloadstart = function() {
            setState({ ...state, PGNLoading: true });
        };
        read.onloadend = function(){
            setState({
                ...state,
                PGNLoading: false,
                PGN: read.result,
                PGNUploaded: true,
                uploadedPGNFilename: files[0].name,
            });
        };
        read.readAsText(files[0]);
    };
    
    var handleSubmitPGN = function(event) {
        event.preventDefault();

        const form = event.target.elements;
        const action = 'load';

        const json = JSON.stringify({ sessionID, action, PGN, uploadedPGNFilename });
        console.log(sessionID, action, PGN, uploadedPGNFilename);
        const params = {
            headers: {'Content-Type': 'application/json'}
        };
        setState({ ...state, PGNLoading: true });
        axios.post(HOST + '/api/analysis', json, params)
            .then(response => {
                const data = response.data;

                setState({
                    ...state,
                    PGNLoading: false,
                    startResponse: data.message,
                    PGNLoaded: true,
                });

                onLoad(data);
        });
    };

    var onDropdownChange = function({value, label}) {
        console.log(value);
        setState({ ...state, cachedPGNFilename: value })
    }

    const onClearClick = function() {
        setState({ ...state, cachedPGNFilename: null })
    }

    const onLoadCached = function() {
        getCachedPGN(cachedPGNFilename);
    }

    return (
        <div className={classes.uploadRoot}>
            <Row>
                <Col className={classes.uploadPGN}>
                    <Form className="analysis-form" noValidate onSubmit={handleSubmitPGN}>
                        {/* <Form.Group controlId="AnalysisFEN">
                            <Form.Label>FEN</Form.Label>
                            <Form.Control as="textarea" rows={1} />
                        </Form.Group> */}
                        <Form.Group controlId="AnalysisPGN" onChange={uploadFile}>
                            <Form.File label="Upload PGN" />
                        </Form.Group>
                        <Row>
                            <Button disabled={!PGNUploaded} type="submit" variant="primary">Load Games</Button>
                            <Spinner hidden={!PGNLoading} animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                        </Row>
                    </Form>
                    <div className="start-session-result">{startResponse}</div>
                </Col>

                <Col className={classes.cachedPGN}>
                    <Row>
                        <Dropdown
                            style={classes.cacheDropdown}
                            options={cachedPGNFilenames}
                            onChange={onDropdownChange}
                            value={cachedPGNFilename}
                            placeholder="select a cached PGN" />
                        <Button onClick={onClearClick}>Clear</Button>
                        <Spinner hidden={!cachedPGNFilenamesLoading} animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                    </Row>
                    <Row>
                        <Button disabled={cachedPGNFilename === null} onClick={onLoadCached} type="submit" variant="primary">Load Cached</Button>
                        <Spinner hidden={!cachedPGNLoading} animation="border" role="status">
                            <span className="sr-only">Loading...</span>
                        </Spinner>
                    </Row>
                </Col>
            </Row>
        </div>
    )
}