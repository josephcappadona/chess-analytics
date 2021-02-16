import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";

const LOWER = 0;
const UPPER = 3500;
const STEP = 100;
const DEFAULT_RANGE = [1400, 3500];

const useStyles = makeStyles({
  root: {
    width: 350
  },
  slider: {},
  input: {
    width: 50
  }
});

const isValid = function (value) {
  return value[0] !== "" && value[1] !== "";
};

const cleanValue = function (value) {
  const newValue = [];
  if (value[0] === "") {
    newValue.push(LOWER);
  } else {
    newValue.push(value[0]);
  }
  if (value[1] === "") {
    newValue.push(UPPER);
  } else {
    newValue.push(value[1]);
  }
  return newValue;
};

function InputSlider(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(DEFAULT_RANGE);

  const callback = function (value) {
    if (typeof props.callback === "function") {
      props.callback(value);
    }
  };

  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
    callback(newValue);
  };

  const handleInputChangeLower = (event) => {
    const val = Number(event.target.value);
    if (!isNaN(val)) {
      const newValue = [event.target.value === "" ? "" : val, value[1]];
      setValue(newValue);
      callback(newValue);
    }
  };
  const handleInputChangeUpper = (event) => {
    const val = Number(event.target.value);
    if (!isNaN(val)) {
      const newValue = [value[0], event.target.value === "" ? "" : val];
      setValue(newValue);
      callback(newValue);
    }
  };

  return (
    <div className={classes.root}>
      <Typography id="input-slider" gutterBottom>
        ELO Range
      </Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item>
          <Input
            className={classes.input}
            value={value[0]}
            margin="dense"
            onChange={handleInputChangeLower}
            inputProps={{
              min: LOWER,
              max: UPPER,
              step: STEP,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
        </Grid>
        <Grid item xs>
          <Slider
            className={classes.slider}
            value={isValid(value) ? value : cleanValue(value)}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            min={LOWER}
            max={UPPER}
            step={STEP}
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={value[1]}
            margin="dense"
            onChange={handleInputChangeUpper}
            inputProps={{
              min: LOWER,
              max: UPPER,
              step: STEP,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}


// export default function ParentApp(props) {

//     const [range, setRange] = React.useState(DEFAULT_RANGE);
//     const [moves, setMoves] = React.useState(["e4"]);
//     const [nextMoves, setNextMoves] = React.useState(["e5", "d5", "Nc6"]);
  
//     return (
//       <div>
//         <InputSlider callback={setRange} />
//         {nextMoves.map(function(move){
//               const buttonOnClick = function(){
//                 console.log(moves.concat(move));
//               }
//               return (<Button onClick={buttonOnClick} variant="contained" color="primary">
//                 {move}
//               </Button>)
//             }
//           )
//         }
//       </div>
//     )
//   }