import { interval, fromEvent} from 'rxjs'
import { map, filter, flatMap, takeUntil, scan} from 'rxjs/operators'

function pong() {
    // Inside this function you will use the classes and functions 
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!

    // svg is the canvas element
    const svg = document.getElementById("canvas")!;

    /**
     * Creates a svg rectangle
     * 
     * @param x - the x coordinate of the rectangle (top left corner of the rectangle)
     * @param y - the y coordinate of the rectangle (top left corner of the rectangle)
     * @param width - the wifth of the rectangle
     * @param height - the height of the rectangle
     * @param fill - sets the color of the rectangle
     */
    function createRectangle(x: number, y: number, width: number, height: number, fill: string){
      //This code here was taken from the animatedRectTimer function in the observableexamples.ts
      const object = document.createElementNS(svg.namespaceURI, 'rect')
      Object.entries({
        x: x, 
        y: y,
        width: width, 
        height: height,
        fill: fill,
      }).forEach(([key,val]) => object.setAttribute(key,String(val)))
      svg.appendChild(object)
      return object;
    }

    /**
     * Creates a svg circle
     * 
     * @param cx - the x coordinate of the center of the circle
     * @param cy - the y coordinate of the center of circle
     * @param r - the radius of the circle
     * @param fill - sets the color of the circle
     */
    function createCircle(cx: number, cy: number, r: number, fill: string){
      const object = document.createElementNS(svg.namespaceURI, 'circle')
      Object.entries({
        cx: cx, 
        cy: cy,
        r: r,
        fill: fill,
      }).forEach(([key,val]) => object.setAttribute(key,String(val)))
      svg.appendChild(object)
      return object;
    }

    /**
     * Sets the attribute of the specified object
     * 
     * @param obj - An Element
     * @param attribute - the attribute to be set
     * @param value - the new value to be updated
     */
    function setAttr<T>(obj: Element, attribute: string, value: T){
      obj.setAttribute(attribute,String(value))
    }

    /**
     * Retrieve the values of the specified attribute of the specified object
     * 
     * @param obj - An Element
     * @param attribute - the attribute of the object
     */
    function getAttr(obj: Element, attribute: string){
      return Number(obj.getAttribute(attribute))
    }
    
    //player 1
    const player1 = createRectangle(svg.clientLeft + 50,svg.clientHeight/2-25,8,50,'#FFFFFF');

    //player 2
    const player2 = createRectangle(svg.clientWidth -50,svg.clientHeight/2-25,8,50,'#FFFFFF');

    //vertical line
    const line = createRectangle(svg.clientWidth/2,0,3,svg.clientHeight,'#FFFFFF');

    //ball
    const ball = createCircle(svg.clientWidth/2,svg.clientHeight/2,6,'#FFFFFF');

    //myObservable will capture and record the events every 10 milliseconds
    const myObservable = interval(10)

    const ball_state = {
      cx: getAttr(ball,'cx'),
      cy: getAttr(ball,'cy'),
      r: getAttr(ball,'r'),
      fill: getAttr(ball,'fill'),
      x: -2,
      y: 0,
      speed: 1
    }

    const score_state = {
      p1_score: 0,
      p2_score: 0
    }

    /**
     * Moves the ball based on the x,y direction and speed
     * 
     * @param x - x controls the horizontal direction
     * @param y - y controls the vertical direction
     * @param speed - speed controls the speed of the ball
     */
    function moveBall(x: number, y: number, speed: number){
      setAttr(ball,'cx', x*speed + getAttr(ball,'cx'))
      setAttr(ball,'cy', y*speed + getAttr(ball,'cy'))
    }

    function start_game(){
      const restart = document.getElementById('restart')!; //restart contains the message to restart the game
      const winner = document.getElementById('winner')!; //winner is the message to announce the winner
      restart.innerHTML = ""; // reset the message to empty string
      winner.innerHTML = "";
      myObservable.pipe(
        filter(() => score_state.p1_score < 7 && score_state.p2_score < 7)) // the game will continue playing until one of the players score 7 points
        .subscribe(() => {
          moveBall(ball_state.x,ball_state.y,ball_state.speed), // the ball will continuously moving until a winner is announced
          setAttr(player2,'y', (getAttr(ball,'cy') - getAttr(player2,'height')/2)* 0.94) // slow down the AI by 6% so it won't perfectly catch up
        })
    }
    
    function player_collision(){

      /**
       * Controls the collision impact of the ball and the player
       * 
       * @param obj - SVG element
       * @param from - the starting range
       * @param to - the ending range
       * @param arg_x - the argument x to change the x direction of the ball
       * @param arg_y - the argument y to change the y direction of the ball
       * @param arg_speed - the argument speed to change the speed of the ball
       * 
       * The condition for collision between player 1 and the ball is that the left side of the ball must touch the right side of the ball,
       * and the top part of the ball must be in range from the bottom part of the paddle. Likewise, for the bottom part of the ball must be
       * in range of the top part of the paddle in order for collision.
       * 
       *                      O          
       *                     /
       *  +---+        +---+/
       *  |   | /      |   |\
       *  |   |/       |   | \
       *  +---+\       +---+ 
       *        \
       *         O
       */
      function player1_collision(obj: Element, from: number, to: number, arg_x: number, arg_y: number, arg_speed: number){
        myObservable.pipe(
          filter(() => getAttr(ball,'cx') - getAttr(ball,'r') <= getAttr(obj,'x') + getAttr(obj,'width') // When the left side of the ball touches the right side of the paddle
          && getAttr(ball,'cy') + getAttr(ball,'r') >= getAttr(obj,'y') + getAttr(obj,'height') * (from) // When the bottom part of the ball is within range of the top part of the paddle
          && getAttr(ball,'cy') - getAttr(ball,'r') <= getAttr(obj,'y') + getAttr(obj,'height') * (to))) // When the top part of the ball is within range of the bottom part of the paddle
        .subscribe(() => {ball_state.x = arg_x, ball_state.y = arg_y, ball_state.speed = arg_speed}) // Update the x and y direction as well as the speed of the ball
      }

      function player2_collision(obj: Element, from: number, to: number, arg_x: number, arg_y: number, arg_speed: number){
        myObservable.pipe(
          filter(() => getAttr(ball,'cx') + getAttr(ball,'r') >= getAttr(obj,'x')
          && getAttr(ball,'cy') + getAttr(ball,'r') >= getAttr(obj,'y') + getAttr(obj,'height') * (from)
          && getAttr(ball,'cy') - getAttr(ball,'r') <= getAttr(obj,'y') + getAttr(obj,'height') * (to)))
        .subscribe(() => {ball_state.x = arg_x, ball_state.y = arg_y, ball_state.speed = arg_speed})
      }

      //deflect on player 1
      player1_collision(player1,   0, 1/4,  2, -1, 2.5) //when the ball hits the top quarter of the paddle, it will bounce off at 1 y-angle and the y velocity of the ball will increased by 3.
      player1_collision(player1, 1/4, 1/2,  2, -0.5, 2) //when the ball hits the top middle quarter of the paddle, it will bounce off at 0.5 y-angle and the y velocity of the ball will increased by 2.
      player1_collision(player1, 1/2, 3/4,  2, 0.5, 2) //when the ball hits the bottom middle quarter of the paddle, it will bounce off at -0.5 y-angle and the y velocity of the ball will increased by 2.
      player1_collision(player1, 3/4,   1,  2, 1, 2.5) //when the ball hits the bottom quarter of the paddle, it will bounce off at -1 y-angle and the y velocity of the ball will increased by 3.

      //deflect on player 2
      player2_collision(player2,  0,  1/4, -2, -1, 2.5) //when the ball hits the top quarter of the paddle, it will bounce off at 1 y-angle and the y velocity of the ball will increased by 3.
      player2_collision(player2, 1/4, 1/2, -2, -0.5, 2) //when the ball hits the top middle quarter of the paddle, it will bounce off at 0.5 y-angle and the y velocity of the ball will increased by 2.
      player2_collision(player2, 1/2, 3/4, -2, 0.5, 2) //when the ball hits the bottom middle quarter of the paddle, it will bounce off at -0.5 y-angle and the y velocity of the ball will increased by 2.
      player2_collision(player2, 3/4,   1, -2, 1, 2.5) //when the ball hits the bottom quarter of the paddle, it will bounce off at -1 y-angle and the y velocity of the ball will increased by 3.
    }

    function canvas_collision(){
      //When the ball deflects on the top of the canvas, it bounces back
      myObservable.pipe(
        filter(() => getAttr(ball,'cy') - getAttr(ball,'r') <= svg.clientTop)) //svg.clientTop contains the value of the top part of the canvas
          .subscribe(() => ball_state.y = -ball_state.y) // Changing the sign of the y direction of the ball (bounces down)

      //When the ball deflects on the bottom of the canvas, it bounces back
      myObservable.pipe(
        filter(() => getAttr(ball,'cy') + getAttr(ball,'r') >= svg.clientHeight)) //svg.clientHeught contains the value of the bottom part of the canvas
          .subscribe(() => ball_state.y = -ball_state.y) // changing the sign of the y direction of the ball (bounces up)
    }

    function ball_reset(){
      const p1 = document.getElementById("p1")!;
      const p2 = document.getElementById('p2')!;
      
      //When hitting the left of the canvas, ball is resetted to the middle
      myObservable.pipe(
        filter(() => getAttr(ball,'cx') <= svg.clientLeft), //When the ball touches the left side of the canvas
          map(() => {
            setAttr(ball,'cx',svg.clientWidth/2), //Set the cx and cy of the ball back to the centre of the canvas
            setAttr(ball,'cy',svg.clientHeight/2)})
        ).subscribe(() => {
          ball_state.x = -2, //reinialise the all ball_state values to default
          ball_state.y = 0, 
          ball_state.speed = 1, 
          score_state.p2_score++, //Update player 2's score
          p2.innerHTML = String(score_state.p2_score) //Update to display the current player 2's score in HTML
        })

      //When hitting the right of the canvas, ball is resetted to the middle
      myObservable.pipe(
        filter(() => getAttr(ball,'cx') >= svg.clientWidth), //When the ball touches the right side of the canvas
        map(() => {
          setAttr(ball,'cx',svg.clientWidth/2), //Set the cx and cy of the ball back to the centre of the canvas
          setAttr(ball,'cy',svg.clientHeight/2)})
        ).subscribe(() => {
            ball_state.x = -2, //reinialise the all ball_state values to default
            ball_state.y = 0, 
            ball_state.speed = 1, 
            score_state.p1_score++, //Update player 1's score
            p1.innerHTML = String(score_state.p1_score) //Update to display the current player 1's score in HTML
          })
    }
    
    function end_game(){
      const winner = document.getElementById('winner')!; // winner is a text id in the svg canvas

      //When player 1 reaches the score of 7, announce winner
      myObservable.pipe(
        filter(() => score_state.p1_score >= 7)
        ).subscribe(() => {
              winner.innerHTML = "Player 1 is the winner", //Display the message of the winner
              restart_game()
      })

      //When player 2 reaches the score of 7, announce winner
      myObservable.pipe(
        filter(() => score_state.p2_score >= 7)
        ).subscribe(() => {
            winner.innerHTML = "Player 2 is the winner", //Display the message of the winner
            restart_game()
      })
    }

    function keyBoardControl(){
      const moveDistance = 7;
      const keyDownObservable = fromEvent<KeyboardEvent>(document,"keydown"); //keyDown event is fired when a key is pressed
      const keyUpObservable = fromEvent<KeyboardEvent>(document,"keyup"); //keyUp event is fired when a key is released

      interface State {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
      }

      const player1_state: State = { 
        x: getAttr(player1,'x'), 
        y: getAttr(player1,'y'), 
        width: getAttr(player1,'width'), 
        height: getAttr(player1,'height')
      }

      function updateState(state: State, moveDist: number): State {
        return {...state,
          //player 1 can only keep moving within the canvas space provided, it cannot go beyond the top of the canvas or bottom of the canvas
          y: ((getAttr(player1,'y') + moveDist) >= (svg.clientTop) 
             && (getAttr(player1,'y') + moveDist) <= (svg.clientHeight - getAttr(player1,'height'))) 
             ? state.y + moveDist : state.y
        }
      }

      function movePaddle(state: State): void {
        setAttr(player1,'y',state.y)
      }

      //This code was taken from Tim Dwyer's asteroids function for rotating ships (with some modification)
      //Dwyer, T. (2020). Asteroids Function (source: https://stackblitz.com/edit/asteroids01)
      keyDownObservable.pipe(
        filter(({repeat}) => !repeat), //Negating repeat so repeated events won't accumulate (long pressing a key will make it go faster, !repeat will stop it)
        filter(({keyCode: k}) => k === 87 || k === 38 || k === 83 || k === 40), // 87 = "W", 83 = "S", 38 = UpArrowKey, 40 = DownArrowKey
        flatMap((downKey) => interval(10).pipe(
          takeUntil(keyUpObservable.pipe(
            filter(upKey => upKey.keyCode === downKey.keyCode))), //Keep repeating the event until the release key is the same as the pressed key
          map(() => (downKey.keyCode === 40 || downKey.keyCode === 83) ? moveDistance : -moveDistance))),
          scan(updateState,player1_state)) // scan will transform the old state into a new state
        .subscribe(movePaddle) 
    }
    
    function restart_game(){
      const p1 = document.getElementById("p1")!;
      const p2 = document.getElementById('p2')!;
      const restart = document.getElementById('restart')!;
      const winner = document.getElementById('winner')!;
      const clickObservable = fromEvent(document,'click'); //click event is used so users can click to restart the game
      restart.innerHTML = "Click to restart game"; //Display the message to prompt for a restart for the game

      svg.removeChild(line);
      winner.innerHTML = ""; //Remove the text
      restart.innerHTML = "";
      
      clickObservable.subscribe(() => {
        //Remove the svg objects in the current pong state so it doesn't transfer to the next pong game when it restarts
        svg.removeChild(player1); //Remove player 1
        svg.removeChild(player2); //Remove player 2
        svg.removeChild(ball); //Remove ball
        p1.innerHTML = "0"; //Reset player 1's score to 0
        p2.innerHTML = "0"; //Reset player 2's score to 0
        pong()})
    }

    function main(){
      start_game()
      player_collision()
      canvas_collision()
      ball_reset()
      end_game()
      setTimeout(keyBoardControl,0)
    }
    main()
  }

  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
  
  

