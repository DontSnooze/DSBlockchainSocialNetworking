import Web3 from 'web3'
import React, { Component } from 'react';
import './App.css';
import Navbar from './Navbar'
import Main from './Main'
import DSSocialNetwork from '../abis/DSSocialNetwork.json'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = DSSocialNetwork.networks[networkId]
    console.log(networkData)
    if(networkData) {
      const socialNetwork = web3.eth.Contract(DSSocialNetwork.abi, networkData.address)
      this.setState({ socialNetwork })
      const postCount = await socialNetwork.methods.postCount().call()
      this.setState({ postCount })
      // Load Posts
      for (var i = 1; i <= postCount; i++) {
        const post = await socialNetwork.methods.posts(i).call()
        this.setState({
          posts: [...this.state.posts, post]
        })
      }
      
      this.setState({
        posts: this.state.posts.sort((a,b) => b.tipAmount - a.tipAmount)
      })

      // Set loading to false
      this.setState({ loading: false})

      // console.log('networkData.address: ' + networkData.address)
      // console.log('socialNetwork.options.address: ' + socialNetwork.options.address)
    } else {
      window.alert('DSSocialNetwork contract not deployed to detected network.')
    }
  }

  createPost(content) {
    const web3 = window.web3
    this.setState({ loading: true })
    let originalThis = this

    web3.eth.sendTransaction({
        from: this.state.account,
        to: this.state.socialNetwork.options.address,
        data: this.state.socialNetwork.methods.createPost(content).encodeABI()
    })
    .on('transactionHash', function(hash){
      console.log('transactionHash: ' + hash)
    })
    .on('receipt', function(receipt){
        // not getting this
        console.log('receipt: ' + receipt)
    })
    .on('confirmation', function(confirmationNumber, receipt){
      console.log('confirmationNumber, receipt: ' + confirmationNumber + ', ' + receipt)
      originalThis.setState({ loading: false })
      window.location.reload();
    })
    .on('error', console.error);
  };

  tipPost(id, tipAmount) {
    const web3 = window.web3
    this.setState({ loading: true })
    let originalThis = this

    this.state.socialNetwork.methods.tipPost(id)
    .send({ from: this.state.account, value: tipAmount })
    .on('transactionHash', function(hash){
      console.log('transactionHash: ' + hash)
    })
    .on('confirmation', function(confirmationNumber, receipt) {
      console.log('tipPost Received - confirmationNumber, receipt: ' + confirmationNumber + ', ' + receipt)
      originalThis.setState({ loading: false })
      window.location.reload();
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      socialNetwork: null,
      postCount: 0,
      posts: [],
      loading: true
    }
    this.createPost = this.createPost.bind(this)
    this.tipPost = this.tipPost.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              posts={this.state.posts}
              createPost={this.createPost}
              tipPost={this.tipPost}
            />
        }
      </div>
    );
  }
}

export default App;
