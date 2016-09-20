import React from 'react'
import AppStore from '../stores/AppStore'
import * as AppActions from '../actions/AppActions'


export class App extends React.Component {

  constructor() {
    super()
    this.state = {
      user: AppStore.getUser(),
      available: ''
    }
  }

  componentWillMount() {
    AppStore.on('change', () => {
      this.setState({
        user: AppStore.getUser()
      })
    })
  }

  componentDidMount() {
    if (!this.state.user.cuid){
      this.receiveUser()
    }   
  }

  receiveUser() {
    AppActions.currentUser()
  }

  render() {
	  const childrenWithProps = React.Children.map(this.props.children, (child) => React.cloneElement(child, {
   	 	user: this.state.user,
   	 	available: this.state.available
     })
    )

    return (
    	<div className="container main-div">
    		<h1 id="site-header">NSB Date</h1>
        {childrenWithProps}
      </div>
    )
  }
}

export default App;