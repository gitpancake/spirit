// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { SafeCast } from "@openzeppelin-v5/contracts/utils/math/SafeCast.sol";
import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import { ISuperToken, SuperToken } from "@superfluid-finance/ethereum-contracts/contracts/superfluid/SuperToken.sol";
import { console2 } from "forge-std/Test.sol";

import { IVestingSchedulerV3 } from
    "@superfluid-finance/automation-contracts/scheduler/contracts/interface/IVestingSchedulerV3.sol";
import { ISpiritVesting, SpiritVesting } from "src/vesting/SpiritVesting.sol";
import { SpiritVestingFactory } from "src/vesting/SpiritVestingFactory.sol";
import { SpiritTestBase } from "test/base/SpiritTestBase.t.sol";

using SuperTokenV1Library for ISuperToken;
using SafeCast for int256;

contract SpiritVestingTest is SpiritTestBase {

    SpiritVesting public spiritVesting;

    uint256 public constant VESTING_AMOUNT = 100_000_000 ether;
    uint256 public constant CLIFF_AMOUNT = 20_000_000 ether;

    uint32 public constant VESTING_DURATION = 104 weeks;
    uint32 public constant CLIFF_PERIOD = 52 weeks;

    uint32 public cliffDate;
    int96 public flowRate;

    function setUp() public virtual override {
        super.setUp();

        // Move time forward to avoid vesting scheduler errors (time based input validation constraints)
        vm.warp(block.timestamp + 420 days);

        vm.prank(TREASURY);
        _spirit.approve(address(_spiritVestingFactory), VESTING_AMOUNT);

        cliffDate = uint32(block.timestamp + CLIFF_PERIOD);
        flowRate = int256((VESTING_AMOUNT - CLIFF_AMOUNT) / uint256(VESTING_DURATION)).toInt96();

        vm.prank(TREASURY);
        _spiritVestingFactory.createSpiritVestingContract(
            ALICE, VESTING_AMOUNT, CLIFF_AMOUNT, cliffDate, uint32(cliffDate + VESTING_DURATION)
        );

        spiritVesting = SpiritVesting(address(_spiritVestingFactory.spiritVestings(ALICE)));
    }

    function testVesting() public {
        // Move time to after vesting can be started
        vm.warp(cliffDate);

        // Execute the vesting start
        _vestingScheduler.executeCliffAndFlow(_spirit, address(spiritVesting), ALICE);

        // Account for the remainder
        uint256 expectedCliffAmount = VESTING_AMOUNT - (uint96(flowRate) * VESTING_DURATION);

        assertEq(_spirit.balanceOf(ALICE), expectedCliffAmount, "Alice should have received the cliff amount");
        assertEq(_spirit.getFlowRate(address(spiritVesting), ALICE), flowRate, "Flow rate mismatch");

        IVestingSchedulerV3.VestingSchedule memory aliceVS =
            _vestingScheduler.getVestingSchedule(address(_spirit), address(spiritVesting), ALICE);

        // Move time to after vesting can be concluded (before the stream gets critical)
        vm.warp(aliceVS.endDate - 5 hours);

        _vestingScheduler.executeEndVesting(_spirit, address(spiritVesting), ALICE);

        assertEq(_spirit.balanceOf(ALICE), VESTING_AMOUNT, "Alice should have the full amount");
        assertEq(_spirit.balanceOf(address(spiritVesting)), 0, "SpiritVesting contract should be empty");
    }

    function testVestingFuzz(uint256 _amount, uint32 _cliffDate, uint32 _endDate) public {
        address recipient = vm.addr(69_420);
        _amount = bound(_amount, 1 ether, 1_000_000 ether);
        _endDate = uint32(bound(_endDate, block.timestamp + 365 days, block.timestamp + (365 days * 10)));
        _cliffDate = uint32(bound(_cliffDate, block.timestamp + 3 days, _endDate - 7 days));

        vm.startPrank(TREASURY);
        _spirit.approve(address(_spiritVestingFactory), _amount);

        address recipientSpiritVesting =
            _spiritVestingFactory.createSpiritVestingContract(recipient, _amount, _amount / 3, _cliffDate, _endDate);

        vm.stopPrank();

        (uint256 expectedCliff, int96 expectedFlowRate) =
            _helperCalculateExpectedCliffAndFlow(_amount, _endDate - _cliffDate);

        // Move time to after vesting can be started
        vm.warp(_cliffDate);

        // Execute the vesting start
        _vestingScheduler.executeCliffAndFlow(_spirit, recipientSpiritVesting, recipient);

        assertEq(_spirit.balanceOf(recipient), expectedCliff, "Recipient should have received the cliff amount");
        assertEq(_spirit.getFlowRate(recipientSpiritVesting, recipient), expectedFlowRate, "Flow rate mismatch");

        // Move time to after vesting can be concluded (before stream gets critical)
        vm.warp(_endDate - 5 hours);

        _vestingScheduler.executeEndVesting(_spirit, recipientSpiritVesting, recipient);

        assertEq(_spirit.balanceOf(recipient), _amount, "Recipient should have the full amount");
        assertEq(_spirit.balanceOf(address(recipientSpiritVesting)), 0, "SpiritVesting contract should be empty");
    }

    function testCancelVestingBeforeVestingStart(address nonAdmin) public {
        vm.assume(nonAdmin != address(TREASURY));

        vm.prank(nonAdmin);
        vm.expectRevert(ISpiritVesting.FORBIDDEN.selector);
        spiritVesting.cancelVesting();

        uint256 treasuryBalanceBefore = _spirit.balanceOf(TREASURY);
        uint256 aliceVestingBalanceBefore = _spirit.balanceOf(address(spiritVesting));

        vm.prank(TREASURY);
        spiritVesting.cancelVesting();

        assertEq(
            _spirit.balanceOf(TREASURY), treasuryBalanceBefore + aliceVestingBalanceBefore, "Balance should be updated"
        );

        assertEq(_spirit.balanceOf(address(spiritVesting)), 0, "Balance should be 0");
    }

    function testCancelVestingAfterVestingStart(address nonAdmin) public {
        vm.assume(nonAdmin != address(TREASURY));

        vm.prank(nonAdmin);
        vm.expectRevert(ISpiritVesting.FORBIDDEN.selector);
        spiritVesting.cancelVesting();

        // Move time to after vesting can be started
        vm.warp(cliffDate + 1 minutes);

        // Execute the vesting start
        _vestingScheduler.executeCliffAndFlow(_spirit, address(spiritVesting), ALICE);

        int96 vestingFlowRate = _spirit.getFlowRate(address(spiritVesting), ALICE);

        assertEq(vestingFlowRate, flowRate, "Flow rate mismatch");

        vm.warp(block.timestamp + 5 days);

        uint256 treasuryBalanceBefore = _spirit.balanceOf(TREASURY);
        uint256 aliceVestingBalanceBefore = _spirit.balanceOf(address(spiritVesting));

        vm.prank(TREASURY);
        spiritVesting.cancelVesting();

        assertEq(_spirit.getFlowRate(address(spiritVesting), ALICE), 0, "Flow should be deleted");

        assertApproxEqAbs(
            _spirit.balanceOf(TREASURY),
            treasuryBalanceBefore + aliceVestingBalanceBefore,
            (_spirit.balanceOf(TREASURY) * 10) / 10_000, // 0.1% tolerance
            "Balance should be updated"
        );

        assertEq(_spirit.balanceOf(address(spiritVesting)), 0, "Balance should be 0");
    }

    function testCancelVestingStreamManuallyClosedByRecipient() public {
        // Move time to after vesting can be started
        vm.warp(cliffDate + 1 minutes);

        // Execute the vesting start
        _vestingScheduler.executeCliffAndFlow(_spirit, address(spiritVesting), ALICE);

        int96 vestingFlowRate = _spirit.getFlowRate(address(spiritVesting), ALICE);

        assertEq(vestingFlowRate, flowRate, "Flow rate mismatch");

        vm.warp(block.timestamp + 5 days);

        uint256 treasuryBalanceBefore = _spirit.balanceOf(TREASURY);
        uint256 aliceVestingBalanceBefore = _spirit.balanceOf(address(spiritVesting));

        vm.startPrank(ALICE);
        _spirit.deleteFlow(address(spiritVesting), ALICE);
        vm.stopPrank();

        vm.prank(TREASURY);
        spiritVesting.cancelVesting();

        assertEq(_spirit.getFlowRate(address(spiritVesting), ALICE), 0, "Flow should be deleted");

        assertApproxEqAbs(
            _spirit.balanceOf(TREASURY),
            treasuryBalanceBefore + aliceVestingBalanceBefore,
            (_spirit.balanceOf(TREASURY) * 10) / 10_000, // 0.1% tolerance
            "Balance should be updated"
        );

        assertEq(_spirit.balanceOf(address(spiritVesting)), 0, "Balance should be 0");
    }

    function testCancelVestingStreamManuallyClosedByRecipientAndVestingEnded() public {
        IVestingSchedulerV3.VestingSchedule memory aliceVS =
            _vestingScheduler.getVestingSchedule(address(_spirit), address(spiritVesting), ALICE);

        // Move time to after vesting can be started
        vm.warp(cliffDate + 1 minutes);

        // Execute the vesting start
        _vestingScheduler.executeCliffAndFlow(_spirit, address(spiritVesting), ALICE);

        int96 vestingFlowRate = _spirit.getFlowRate(address(spiritVesting), ALICE);

        assertEq(vestingFlowRate, flowRate, "Flow rate mismatch");

        vm.warp(block.timestamp + 5 days);

        uint256 treasuryBalanceBefore = _spirit.balanceOf(TREASURY);
        uint256 aliceVestingBalanceBefore = _spirit.balanceOf(address(spiritVesting));

        vm.startPrank(ALICE);
        _spirit.deleteFlow(address(spiritVesting), ALICE);
        vm.stopPrank();

        // Move time to after vesting can be concluded (before the stream gets critical
        vm.warp(aliceVS.endDate - 5 hours);

        _vestingScheduler.executeEndVesting(_spirit, address(spiritVesting), ALICE);

        vm.prank(TREASURY);
        spiritVesting.cancelVesting();

        assertEq(_spirit.getFlowRate(address(spiritVesting), ALICE), 0, "Flow should be deleted");

        assertApproxEqAbs(
            _spirit.balanceOf(TREASURY),
            treasuryBalanceBefore + aliceVestingBalanceBefore,
            (_spirit.balanceOf(TREASURY) * 10) / 10_000, // 0.1% tolerance
            "Balance should be updated"
        );

        assertEq(_spirit.balanceOf(address(spiritVesting)), 0, "Balance should be 0");
    }

    function _helperCalculateExpectedCliffAndFlow(uint256 amount, uint256 vestingDuration)
        internal
        pure
        returns (uint256 expectedCliffAmount, int96 expectedFlowRate)
    {
        expectedCliffAmount = amount / 3;
        expectedFlowRate = int256((amount - expectedCliffAmount) / vestingDuration).toInt96();
        expectedCliffAmount += (amount - expectedCliffAmount) - (uint96(expectedFlowRate) * vestingDuration);
    }

}
