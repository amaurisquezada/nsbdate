import React from 'react';

export default class Display extends React.Component {
  //This component renders its children if the 'if' prop resolves to true. Helps with rendering logic in other components.
	render() {
	  return (this.props.if) ? <div>{this.props.children}</div> : null 
	}
}