import { useEffect, useState } from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { getUserPuzzle, storeUserPuzzle } from './StorageManager';
import { wordExists, wordsAreCloseEnough } from './WordJudge';

const ALPHA_REGEX = /^[a-z]+$/i;

const App = () => {
  // UI state elements
  const [inputWord, setInputWord] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  // Core data element
  const [userPuzzle, setUserPuzzle] = useState('');

  // TODO: all these are copmuted properties of the user puzzle itself. Can I eliminate them?
  const [activeLevel, setActiveLevel] = useState('easy');
  const [activeLevelDefinition, setActiveLevelDefinition] = useState({});
  const [activeLevelAttemptLinkWords, setActiveLevelAttemptLinkWords] = useState([]);


  useEffect(() => {
    const lPadZeroNumber = (number, length) => {
      return (number + "").padStart(length, "0");
    };

    const getShortDateString = (date) => {
      const year = lPadZeroNumber(date.getFullYear(), 4);
      const month = lPadZeroNumber(date.getMonth() + 1, 2);
      const dayOfMonth = lPadZeroNumber(date.getDate(), 2);
      return `${year}-${month}-${dayOfMonth}`;
    };

    const load = async () => {
      const mUserPuzzle = await getUserPuzzle(getShortDateString(new Date()));
      const mActiveLevel = mUserPuzzle.attempt.last_attempted_level || 'easy';
      const mActiveLevelDefinition = mUserPuzzle.definition[mActiveLevel];
      const mActiveLevelAttempt = mUserPuzzle.attempt[mActiveLevel] || {};
      mActiveLevelAttempt.link_words = mActiveLevelAttempt.link_words || [];

      setUserPuzzle(mUserPuzzle);
      setActiveLevel(mActiveLevel);
      setActiveLevelDefinition(mActiveLevelDefinition);
      setActiveLevelAttemptLinkWords(mActiveLevelAttempt.link_words);
    };
    load();
  }, []);

  const submitWord = async () => {
    const sanitizedInputWord = inputWord?.trim().toLocaleLowerCase();
    if (!(sanitizedInputWord?.length)) {
      alert("No word entered");
      return;
    }

    if (!ALPHA_REGEX.test(sanitizedInputWord)) {
      alert("Please use A-Z only, please.");
      return;
    }

    if (sanitizedInputWord === activeLevelDefinition.source_word || activeLevelAttemptLinkWords.includes(sanitizedInputWord)) {
      alert("No word reuse");
      return;
    }

    const previousWord = activeLevelAttemptLinkWords.length
      ? activeLevelAttemptLinkWords[activeLevelAttemptLinkWords.length - 1] : activeLevelDefinition.source_word;

    if (!wordsAreCloseEnough(previousWord, sanitizedInputWord)) {
      alert("Not close enough");
      return;
    }

    if (!(await wordExists(sanitizedInputWord))) {
      alert("Word doesn't exist");
      return;
    }

    setActiveLevelAttemptLinkWords(w => {
      w.push(sanitizedInputWord);
      setUserPuzzle(up => {
        up.attempt[activeLevel] = {
          link_words: w
        };
        storeUserPuzzle(up);
        return up;
      });
      setInputWord("");
      if (sanitizedInputWord === activeLevelDefinition.destination_word) {
        setGameFinished(true);
        setShowWinModal(true);
      }
      return w;
    });
  }

  const resetTo = (index) => {
    setActiveLevelAttemptLinkWords(w => {
      w = w.slice(0, index);
      setUserPuzzle(up => {
        up.attempt[activeLevel] = {
          link_words: w
        };
        storeUserPuzzle(up);
        return up;
      });
      setInputWord("");
      setGameFinished(false);
      return w;
    })
  }

  const share = async () => {
    try {
      await navigator.share({
        title: '⛓️ Chain Letters 🔡',
        url: window.location,
        text: `⛓️ Chain Letters 🔡\n${userPuzzle.definition.id}\n${activeLevelDefinition.source_word}=>${activeLevelDefinition.destination_word}\n\n${activeLevelAttemptLinkWords.length} links`
      });
    } catch (err) {
      console.error(err);
      alert('Your browser doesn\'t support sharing. Screenshot, I guess?');
    }
  }

  return (userPuzzle ? (<Container fluid className='app-container'>
    <h1 className="display-5 my-3 text-center">⛓️ Chain Letters 🔡</h1>
    <p className="lead text-center">
      <span>&#x2014;</span>
      <span className="mx-3">{userPuzzle.definition.id}</span>
      <span>&#x2014;</span>
    </p>
    <Card border="primary" className="my-3">
      <ListGroup variant="flush">
        <ListGroup.Item variant="primary" className="text-center">
          <span className="link-word">{activeLevelDefinition.source_word}
            <i className="fa-solid fa-arrow-right mx-2"></i>
            {activeLevelDefinition.destination_word}
          </span>
        </ListGroup.Item>
        {activeLevelAttemptLinkWords.map((linkWord, index) => {
          const isWinningWord = (gameFinished && index === activeLevelAttemptLinkWords.length - 1);
          return (
            <ListGroup.Item key={linkWord} variant={isWinningWord ? "success" : ""} className="d-flex">
              <div className="me-2 text-secondary"><strong>{index + 1}</strong></div>
              <div className="link-word">{linkWord}</div>
              <Button
                variant="warning"
                size="sm"
                className="ms-auto"
                onClick={() => resetTo(index)}
              ><i className="fa-solid fa-clock-rotate-left"></i></Button>
            </ListGroup.Item>
          );
        })}
        {(gameFinished ? (<></>) :
          <ListGroup.Item className="d-flex">
            <Form.Control
              className="m-0 border-0"
              value={inputWord}
              placeholder="Next word..."
              onKeyUp={(e) => { if (e.code === 'Enter') { submitWord(); } }}
              onChange={(e) => { setInputWord(e.target.value) }}
            />
            <Button
              variant="primary"
              size="sm"
              className="ms-auto"
              onClick={submitWord}
            ><i className="fa-solid fa-plus"></i></Button>
          </ListGroup.Item>
        )}
      </ListGroup>
    </Card>

    {(gameFinished ? (<div className="d-grid gap-2">
      <Button variant="success" size="lg" onClick={share}>
        <i className="fa-solid fa-share-nodes"></i> Share
      </Button>
    </div>) : (<></>))}

    <Modal show={showWinModal} fullscreen="sm-down" centered onHide={() => setShowWinModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>🎉 You won!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          You chained <span className="link-word text-primary px-1">{activeLevelDefinition.source_word}</span>
          &rarr; <span className="link-word text-success px-1">{activeLevelDefinition.destination_word}</span>
          using <strong>{activeLevelAttemptLinkWords.length}</strong> links.
        </p>
        {(navigator.canShare ? (<>
          <p>Share your results with your friends!</p>
          <div className="d-grid gap-2">
            <Button variant="success" size="lg" onClick={share}>
              <i className="fa-solid fa-share-nodes"></i> Share
            </Button>
          </div>
        </>) : (<></>))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowWinModal(false)}>
          Back to game
        </Button>
      </Modal.Footer>
    </Modal>
  </Container>) : (<></>));
};

export default App;