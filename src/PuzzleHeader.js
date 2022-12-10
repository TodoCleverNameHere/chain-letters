import Image from 'react-bootstrap/Image';

export const PuzzleHeader = (props) => <>
  <h1 className="display-5 my-3 text-center">
    <Image src="https://watkins.dev/chainletters/android-chrome-192x192.png" className="me-3" style={{
      maxHeight: "2.5rem",
      marginTop: "-.5rem"
    }} />
    Chain Letters
  </h1>
  <p className="lead text-center">
    <span>&#x2014;</span>
    <span className="mx-3">{props.puzzleID}</span>
    <span>&#x2014;</span>
  </p>
</>;