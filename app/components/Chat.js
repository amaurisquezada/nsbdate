import React from 'react'
import io from 'socket.io-client'
import Display from './Display'
import ChatStore from '../stores/ChatStore'
import * as ChatActions from '../actions/ChatActions'

export default class Chat extends React.Component {

	constructor(){
		super()
		this.convoTrigger = this.convoTrigger.bind(this)
		this.state = {
			grabbed: false,
      convos: {"":""}
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
  	this.setState({grabbed:true})
  	console.log(this.state)
  }

	render(){
    const names = Object.keys(this.state.convos);
    const namesList = names.map(function(name, i){
                    return <h2 key={i}>{name}</h2>;
                  })
		return (
							<div>
								<h1 onClick={this.convoTrigger}>"Hello World"</h1>
									<Display if={this.state.grabbed}>
										{namesList}
									</Display>
							</div>
					 )
	}






}