// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPool.sol";
import "hardhat/console.sol";

contract SafeMock {
    function executeCall(
        address target,
        bytes calldata data
    ) external returns (bool success, bytes memory result) {
        (success, result) = target.call(data);
        if (!success) {
            revert(string(result));
        }
    }

    function executeCallWithValue(
        address target,
        bytes calldata data
    ) external payable returns (bool success, bytes memory result) {
        (success, result) = target.call{value: msg.value}(data);
        if (!success) {
            revert(string(result));
        }
    }

    function approveToken(address token, address to) external {
        IERC20(token).approve(to, type(uint256).max);
    }

    function supplyToPool(
        address pool,
        address token,
        uint256 amount
    ) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(pool, type(uint256).max);
        IPool(pool).deposit(token, amount, address(this), 0);
    }

    function borrowFromPool(
        address pool,
        address token,
        uint256 amount
    ) external {
        IPool(pool).borrow(token, amount, 2, 0, msg.sender);
    }

    function getATokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    receive() external payable {}
}
