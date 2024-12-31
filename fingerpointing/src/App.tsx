
import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { AreaDetection, PictureModel } from './PicturesModel';
import Quadtree from '@timohausmann/quadtree-js';

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

/**
* Returns a random integer between min (inclusive) and max (inclusive).
* The value is no lower than min (or the next integer greater than min
* if min isn't an integer) and no greater than max (or the next integer
* lower than max if max isn't an integer).
* Using Math.round() will give you a non-uniform distribution!
*/
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function App() {
  const refDiv = useRef<HTMLDivElement>(null);
  const refQuadTree = useRef<{tree: Quadtree | null}>({tree: null})
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(true);

  const [pictureModel, setPictureModel] = useState<PictureModel[]>([]);
  const [currentPictureTrain, setCurrentPictureTrain] = useState(0);

  const [trainModeArea, setTrainModeArea] = useState<AreaDetection>({ positionX: 0, positionY: 0, size: 50 })
  const [lastMousePosition, setLastMousePosition] = useState({ posX: 0, posY: 0 });

  const [ runModePicturePath, setRunModePicturePath ] = useState("file.jpg");

  useEffect(()=>{
    document.title = isTrainingMode ? "training" : "live";
  }, [isTrainingMode])

  function mouseMove(event: React.MouseEvent) {
    setLastMousePosition({ posX: event.clientX, posY: event.clientY });
    if (refQuadTree.current && refQuadTree.current.tree) {
      let matchingObjs = refQuadTree.current.tree.retrieve({x: event.clientX, y: event.clientY, width: 1, height: 1});
      if (matchingObjs.length > 0) {

        let objects = matchingObjs.sort(el=> {
          if (Math.pow((el.x)-event.clientX,2.) < el.width*el.width && Math.pow((el.y)-event.clientY,2.) < el.width*el.width) {
            console.log("X", Math.pow((el.x)-event.clientX,2.), el, event.clientX, event.clientY)
          }
          // if (Math.pow((el.y)-event.clientY,2.) < el.width) {
          //   console.log("Y", Math.pow((el.y)-event.clientY,2.), el)
          // }
          return Math.pow((el.x)-event.clientX,2.0)+Math.pow((el.y)-event.clientY,2.0)-(el.width*el.width)
        }).filter(el=>Math.pow((el.x)-event.clientX,2.0)+Math.pow((el.y)-event.clientY,2.0)-(el.width*el.width) < 0.)
        // console.log(event.clientX, event.clientY, matchingObjs.map(el=>Math.pow((el.x)-event.clientX,2.0)+Math.pow((el.y)-event.clientY,2.0)))
        if (objects.length > 0) {

            let randomObj = objects[0];//getRandomInt(0, objects.length-1)]
            // console.log((randomObj as any).file)
            setRunModePicturePath((randomObj as any).file)

        }
      }
    }
  }

  useEffect(() => {
    fetch('./pictures.json')
      .then(data => data.json())
      .then((json: PictureModel[]) => {
        setPictureModel(json);
        if (refDiv.current && refQuadTree.current) {
          refQuadTree.current.tree = new Quadtree({x: 0, y: 0, width: refDiv.current.clientWidth, height: refDiv.current.clientHeight});
          json.forEach(element => {
            new Image().src = "./pictures/"+element.filename;
            if (element.area) {
              refQuadTree.current.tree?.insert({x: element.area?.positionX-element.area.size*0.5, y: element.area?.positionY-element.area.size*0.5, width: element.area.size, height: element.area.size, file:element.filename} as any);
            }
          });
        }
      });
  }, []);

  useEffect(() => {
    if (pictureModel.length > 0) {
      if (pictureModel[currentPictureTrain].area) {
        // alert("loading" + JSON.stringify(pictureModel[currentPictureTrain].area))
        setTrainModeArea(pictureModel[currentPictureTrain].area)
      }

    }
  }, [pictureModel, currentPictureTrain])

  function getHighestDim() {
    if (refDiv.current) {
      return Math.max(refDiv.current.clientWidth, refDiv.current.clientHeight);
    }
    return 1024;
  }

  function onscroll(event) {
    setTrainModeArea(prev => {
      console.log(event)
      prev.size += event.deltaY * 0.025
      return prev
    })
  }

  function keydown(event) {
    if (event.key === " ") { // move cursor
      setTrainModeArea(prev => {
        console.log(event)
        const newData: AreaDetection = {
          positionX: lastMousePosition.posX,
          positionY: lastMousePosition.posY,
          size: prev.size
        }
        return newData
      })
    }
    else if (event.key === "s") {
      setPictureModel(prev => {
        const newModel = [...prev];
        newModel[currentPictureTrain].area = trainModeArea;
        return newModel
      });
    }
    else if (event.key === "ArrowLeft") {
      setTrainModeArea({positionX: 0, positionY: 0, size:50})
      setCurrentPictureTrain(prev => {
        if (prev - 1 <= 0)
          return pictureModel.length - 1
        return prev - 1
      });
    }
    else if (event.key === "ArrowRight") {
      setTrainModeArea({positionX: 0, positionY: 0, size:50})
      setCurrentPictureTrain(prev => {
        if (prev + 1 >= pictureModel.length)
          return 0
        return prev + 1
      });
    }
    else if (event.key === "ArrowDown") {
      const link = document.createElement("a");
      link.href = 'data:text/json,' + encodeURIComponent(JSON.stringify(pictureModel, null, 2));
      link.download = "File.json";
      link.click();
      link.remove();
      console.log(event) 
    }
    else if (event.key === "ArrowUp") {
      setIsTrainingMode(prev=>!prev);
    }
  }

  return (
    <>
      <div ref={refDiv} style={{ position: 'absolute', width: "100vw", height: "100vh" }} onMouseMove={mouseMove} onWheel={onscroll} onKeyDown={keydown} tabIndex={0}>
        {pictureModel.length > 0 && <div style={{ backgroundImage: `url(./pictures/${isTrainingMode ? pictureModel[currentPictureTrain].filename : runModePicturePath})`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain', height: '100vh' }}></div>}
      </div>
      {isTrainingMode && <div style={{ pointerEvents: 'none', position: 'absolute', border: 'red', borderWidth: '2px', borderStyle: 'solid', borderRadius: '50%', left: trainModeArea.positionX - trainModeArea.size * 0.5, top: trainModeArea.positionY - trainModeArea.size * 0.5, width: trainModeArea.size, height: trainModeArea.size }}>

      </div>}
    </>
  )
}

export default App
