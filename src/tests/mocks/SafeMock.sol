// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPool.sol";

contract SafeMock {
    function executeCall(
        address target,
        bytes calldata data
    ) external returns (bool success, bytes memory result) {
        (success, result) = target.call(data);
    }

    function executeCallWithValue(
        address target,
        bytes calldata data
    ) external payable returns (bool success, bytes memory result) {
        (success, result) = target.call(data);
    }

    function approveToken(address token, address to, uint256 amount) external {
        IERC20(token).approve(to, amount);
    }

    function supplyToPool(
        address pool,
        address token,
        uint256 amount
    ) external {
        IERC20(token).transferFrom(msg.sender, pool, amount);
        IPool(pool).deposit(token, amount, msg.sender, 0);
    }

    function borrowFromPool(
        address pool,
        address token,
        uint256 amount
    ) external {
        IPool(pool).borrow(token, amount, 2, 0, msg.sender);
    }
}
