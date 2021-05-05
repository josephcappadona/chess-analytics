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
      
    },
  });

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function AnalysisApp(props) {
    const classes = useStyles();
    const [sessionID, setSessionID] = React.useState(String(Date.now() + getRandomInt(10**12)));

    return (
        <div className={classes.root}>
            <h1>Chess Analysis</h1>
            stuff goes here
        </div>
    );
}


ReactDOM.render(<AnalysisApp />, document.getElementById('analysis-app'));
