import React, { Component } from "react";
import Chess from "chess.js"; // import Chess from  "chess.js"(default) if recieving an error about new Chess() not being a constructor

import Chessboard from "chessboardjsx";

const squareStyling = ({ pieceSquare, history }) => {
  const sourceSquare = history.length && history[history.length - 1].from;
  const targetSquare = history.length && history[history.length - 1].to;

  return {
    [pieceSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" },
    ...(history.length && {
      [sourceSquare]: {
        backgroundColor: "rgba(255, 255, 0, 0.4)"
      }
    }),
    ...(history.length && {
      [targetSquare]: {
        backgroundColor: "rgba(255, 255, 0, 0.4)"
      }
    })
  };
};

export default function HumanVsHuman2(props) {
  const [game, setGame] = React.useState(new Chess());
  const [FEN, setFEN] = React.useState("start");
  const [squareStyles, setSquareStyles] = React.useState({});
  const [pieceSquare, setPieceSquare] = React.useState("");
  const [square, setSquare] = React.useState("");
  const [history, setHistory] = React.useState([]);
  const [dropSquareStyle, setDropSquareStyle] = React.useState({});

  const removeHighlightSquare = () => {
    setSquareStyles(squareStyling({ pieceSquare, history }));
  };

  const highlightSquare = (sourceSquare, squaresToHighlight) => {
    const highlightStyles = [sourceSquare, ...squaresToHighlight].reduce(
      (a, c) => {
        return {
          ...a,
          ...{
            [c]: {
              background:
                "radial-gradient(circle, #fffc00 36%, transparent 40%)",
              borderRadius: "50%"
            }
          },
          ...squareStyling({
            history: history,
            pieceSquare: pieceSquare
          })
        };
      },
      {}
    );
    setSquareStyles({ ...squareStyles, ...highlightStyles });
  };

  const onDrop = ({ sourceSquare, targetSquare }) => {
    // see if the move is legal
    let move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q" // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return;

    const hist = game.history({ verbose: true });
    console.log(hist[hist.length - 1].san);
    setFEN(game.fen());
    setHistory(hist);
    setSquareStyles({ pieceSquare, history });
  };

  const onMouseOverSquare = (square) => {
    // get list of possible moves for this square
    let moves = game.moves({
      square: square,
      verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    let squaresToHighlight = [];
    for (var i = 0; i < moves.length; i++) {
      squaresToHighlight.push(moves[i].to);
    }

    highlightSquare(square, squaresToHighlight);
  };

  const onMouseOutSquare = (square) => removeHighlightSquare(square);

  // central squares get diff dropSquareStyles
  const onDragOverSquare = (square) => {
    setDropSquareStyle(
      square === "e4" || square === "d4" || square === "e5" || square === "d5"
        ? { backgroundColor: "cornFlowerBlue" }
        : { boxShadow: "inset 0 0 1px 4px rgb(255, 255, 0)" }
    );
  };

  const onSquareClick = (square) => {
    setSquareStyles(squareStyling({ pieceSquare: square, history }));

    let move = game.move({
      from: pieceSquare,
      to: square,
      promotion: "q" // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return;

    const hist = game.history({ verbose: true });
    console.log(hist[hist.length - 1].san);
    setFEN(game.fen());
    setHistory(hist);
    setPieceSquare("");
  };

  const onSquareRightClick = (square) => {
    setSquareStyles({ [square]: { backgroundColor: "deepPink" } });
  };

  return (
    <Chessboard
      id="humanVsHuman"
      width={320}
      position={FEN}
      onDrop={onDrop}
      onMouseOverSquare={onMouseOverSquare}
      onMouseOutSquare={onMouseOutSquare}
      boardStyle={{
        borderRadius: "5px",
        boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`
      }}
      squareStyles={squareStyles}
      dropSquareStyle={dropSquareStyle}
      onDragOverSquare={onDragOverSquare}
      onSquareClick={onSquareClick}
      onSquareRightClick={onSquareRightClick}
    />
  );
}