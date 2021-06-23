var DSSocialNetwork = artifacts.require("./DSSocialNetwork.sol");

module.exports = function(deployer) {
  deployer.deploy(DSSocialNetwork);
};