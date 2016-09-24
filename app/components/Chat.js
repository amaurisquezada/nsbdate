import React from 'react'
import io from 'socket.io-client'
import Display from './Display'
import Nav1 from './Nav1'
import ChatStore from '../stores/ChatStore'
import * as ChatActions from '../actions/ChatActions'

export default class Chat extends React.Component {

	constructor(){
		super()
		this.convoTrigger = this.convoTrigger.bind(this)
		this.state = {
      convos: ChatStore.getConvos()
    }
	}

	componentWillMount() {
    ChatStore.on('change', () => {
      this.setState({
        convos: ChatStore.getConvos()
      })
    })
  }

  convoTrigger(){
  	ChatActions.getConvos();
  	console.log(this.state)
  }

	render(){
    const names = Object.keys(this.state.convos);
    const namesList = names.map(function(name, i){
                    return <div className="matches" key={i}>
                    					<h2 key={i}>{name}</h2>
                    				</div>;
                  })
		return (
							<div className="container">
								<Nav1/>
								<div id="chat-container">
									<div id="matched-container">
										{namesList}
									</div>
								</div>
							</div>
					 )
	}






}
								// <h1 onClick={this.convoTrigger}>"Hello World"</h1>
								// 	<Display if={this.state.grabbed}>
								// 		{namesList}
								// 	</Display>