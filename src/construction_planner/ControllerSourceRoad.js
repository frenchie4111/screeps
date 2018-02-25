const constants = require( '~/constants' );

const SourceRoadPlanner = require( './SourceRoadPlanner' );

class ControllerSourceRoad extends SourceRoadPlanner {
    getTarget( room, spawn ) {
        return room.controller;
    }
}

module.exports = ControllerSourceRoad;
