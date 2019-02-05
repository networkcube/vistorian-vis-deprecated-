/// <reference path="../utils/animations.d.ts" />

import * as THREE from 'three';
import * as s from './sorting';

import * as utils from 'vistorian-core/src/utils';
import * as dynamicgraph from 'vistorian-core/src/dynamicgraph';
import * as main from 'vistorian-core/src/main';
import * as messenger from 'vistorian-core/src/messenger';

import * as timeslider from 'vistorian-widgets/src/timeSlider';
import * as glutils from 'vistorian-widgets/src/glutils';

import * as d3 from 'd3';

var COLOR_DEFAULT: THREE.Color = new THREE.Color(0x000000);
var COLOR_HIGHLIGHT: THREE.Color = new THREE.Color(0xff8800);

var OPACITY_DIM: number = .5;

var DURATION: number = 500;

var FONT_SIZE_NODE_LABEL: number = 11;



export class NBounds {
    x: number;
    y: number;
    constructor(v1: number, v2?: number) {
        this.x = v1;
        if (v2 == undefined)
            this.y = v1;
        else
            this.y = v2;
    }
}

var width: number;
var height: number;
var urlVars: any = utils.getUrlVars();
if (urlVars['width'])
    width = parseInt(urlVars['width']);
else
    width = window.innerWidth - 30;
if (urlVars['height'])
    height = parseInt(urlVars['height']);
else
    height = window.innerHeight - 100;

console.log('>>>', width);

var plotMargin: NBounds = new NBounds(80, 0)
var plotWidth: number = width - plotMargin.x * 2;
var plotHeight: number;


// VISUAL STATES
var HIGHT_ROW_DEFAULT: number = 20;
var rowHeight: number = HIGHT_ROW_DEFAULT;
var rowSpacing: number = 0;

// GET DATA
var dgraph: dynamicgraph.DynamicGraph = main.getDynamicGraph();

// times shown/selected in other visualizations
var startTime: dynamicgraph.Time = dgraph.startTime;
var endTime: dynamicgraph.Time = dgraph.endTime;

// times visible at this visualization
var startTimeZoom: dynamicgraph.Time = dgraph.startTime;
var endTimeZoom: dynamicgraph.Time = dgraph.endTime;

plotHeight = rowHeight * dgraph.links().length;
height = plotHeight;


messenger.setDefaultEventListener(updateEvent);
messenger.addEventListener('timeRange', timeRangeHandler);



$('#dataName').text(dgraph.name);

// SVG STUFF
// Timeline
var timeSvg: any = d3.select('#timelineDiv')
    .append('svg')
    .attr('width', width)
    .attr('height', 50)

var timeSlider: timeslider.TimeSlider = new timeslider.TimeSlider(dgraph, plotWidth + 45);
timeSlider.appendTo(timeSvg, plotMargin.x - 10, 0);

timeSvg.append('text')
    .text('Time Range:')
    .attr('x', 0)
    .attr('y', 35)
    .style('font-family', 'Helvetica')
    .style('opacity', 0.5)
    .style('font-size', '10pt')


var timeSvg2: any = d3.select('#timelineDiv')
    .append('svg')
    .attr('width', width)
    .attr('height', 50)

var timeZoomSlider: timeslider.TimeSlider = new timeslider.TimeSlider(dgraph, plotWidth + 45, timezoomCallback);
timeZoomSlider.appendTo(timeSvg2, plotMargin.x - 10, 0);

timeSvg2.append('text')
    .text('Time Zoom:')
    .attr('x', 0)
    .attr('y', 35)
    .style('font-family', 'Helvetica')
    .style('opacity', 0.5)
    .style('font-size', '10pt')



var linkWeightScale: any = d3.scaleLinear().range([0, (rowHeight - rowSpacing) / 2]);

var svg: any = d3.select('#visSvg')
    .attr('width', width)
    .attr('height', height)

// order is the reordered array of links ids
// rank gives the position of a link given its id
var order: any[] = [];
var rank: any[] = [];
// default order of links by id
for (var i = 0; i < dgraph.links().length; i++) {
    order[i] = { id: i, value: i };
    rank[i] = i;
}

var visibleRank: number[];



sortBySimilarity(4);




// Draw labels
var rows: any = svg.selectAll('.row')
    .data(dgraph.links().toArray())
    .enter()
    .append('g')
    .attr('class', 'row')
    .attr('transform', (d: any, i: any) => {
        return 'translate(0, ' + (plotMargin.y + rowHeight * (visibleRank[i] + .6)) + ')';
    });

rows.append('text')
    .datum(function (d: any) { return d.source; })
    .attr('class', 'labelsLeft nodeLabel')
    .attr('text-anchor', 'end')
    .text((d: any, i: any) => { return d.label(); })
    .attr('x', plotMargin.x - 10)
    .on('mouseover', (d: any, i: any) => {
        messenger.highlight('set', <utils.ElementCompound>{ nodes: [d] });
    })
    .on('mouseout', (d: any, i: any) => {
        messenger.highlight('reset');
    })
    .on('click', (d: any, i: any) => {
        if (!d.isSelected()) {
            // if this element has not been selected yet,
            // add it to current selection.
            messenger.selection('add', <utils.ElementCompound>{ nodes: [d] });
        } else {
            var selections: any = d.getSelections();
            var currentSelection: any = dgraph.getCurrentSelection();
            for (var j = 0; j < selections.length; j++) {
                if (selections[j] == currentSelection) {
                    messenger.selection('remove', <utils.ElementCompound>{ nodes: [d] });
                    return;
                }
            }
            // current selection has not been found among already
            // assigned selections, hence add this selection
            messenger.selection('add', <utils.ElementCompound>{ nodes: [d] });
        }
    })
    .style('font-size', FONT_SIZE_NODE_LABEL);

rows.append('text')
    .datum(function (d: any) { return d.target; })
    .attr('class', 'labelsRight nodeLabel')
    .attr('text-anchor', 'start')
    .text((d: any, i: any) => { return d.label(); })
    .attr('x', plotMargin.x + plotWidth + 10)
    .on('mouseover', (d: any, i: any) => {
        messenger.highlight('set', <utils.ElementCompound>{ nodes: [d] });
    })
    .on('mouseout', (d: any, i: any) => {
        messenger.highlight('reset');
    })
    .on('click', (d: any, i: any) => {
        var selections: any = d.getSelections();
        var currentSelection: any = dgraph.getCurrentSelection();
        for (var j = 0; j < selections.length; j++) {
            if (selections[j] == currentSelection) {
                messenger.selection('remove', <utils.ElementCompound>{ nodes: [d] });
                return;
            }
        }
        messenger.selection('add', <utils.ElementCompound>{ nodes: [d] });
    })
    .style('font-size', FONT_SIZE_NODE_LABEL);


// WEB GL

//var scene: THREE.Scene;
//var camera: THREE.OrthographicCamera;
//var renderer: THREE.WebGLRenderer;
var geometry: THREE.BufferGeometry;
var mesh: THREE.Mesh;

// SHADERS`
var attributes: any = {
    customColor: { type: 'c', value: [] }
}

var vertexShaderElement: any = document.getElementById('vertexshader');
var fragmentShaderElement: any = document.getElementById('fragmentshader');

var vertexShader: any = vertexShaderElement ? vertexShaderElement.textContent : null;
var fragmentShader: any = fragmentShaderElement ? fragmentShaderElement.textContent : null;

var shaderMaterial: any = new THREE.ShaderMaterial({
    // attributes: attributes,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    blending: THREE.NormalBlending,
    depthTest: true,
    transparent: true,
    side: THREE.DoubleSide,
    lineWidth: 2
});

// scene
var scene: THREE.Scene = new THREE.Scene();

// camera
var camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
    plotWidth / -2,
    plotWidth / 2,
    plotHeight / 2,
    plotHeight / -2,
    0, 11);

scene.add(camera);
camera.position.x = plotWidth / 2;
camera.position.y = -plotHeight / 2;
camera.position.z = 10;

// renderer
var renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(plotWidth, plotHeight)
renderer.setClearColor(0xffffff, 1);

// position canvas element containing cells
var canvas: HTMLCanvasElement = renderer.domElement;
canvas.width = plotWidth;
canvas.height = plotHeight;


// set canvas listeners
canvas.addEventListener('mousemove', (e: any) => { mouseMove(e); })
canvas.addEventListener('click', click);

$('#visCanvasFO').append(canvas);
d3.select('#visCanvasFO')
    .attr('x', plotMargin.x)
    .attr('y', plotMargin.y)
    .attr('width', plotWidth)
    .attr('height', plotHeight)


// geometry and mesh
// var geometry:THREE.Geometry = new THREE.Geometry();

var vertexColors: number[][] = [];
var material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

export class WaveShape {
    positive: any;
    negative: any;
}

var waveShapes: WaveShape[] = [];
var stepWidth: number = 0; // INIT?? 
var stretchFactorX: number = 1;
var stretchFactorY: number = 1;

var waveHighlightFrames: THREE.Mesh[] = []
var waveSelectionFrames: THREE.Mesh[] = []


// CREATE DIM LAYER RECTANGLES
var rectLength: number = plotWidth;
var dimLayerLeft: THREE.Shape = new THREE.Shape();
dimLayerLeft.moveTo(0, 0);
dimLayerLeft.lineTo(0, -plotHeight);
dimLayerLeft.lineTo(-rectLength, -plotHeight);
dimLayerLeft.lineTo(-rectLength, 0);
// dimLayerLeft.lineTo( 0, 0, 1);
dimLayerLeft.lineTo(0, 0);

var rectGeomLeft: THREE.ShapeGeometry = new THREE.ShapeGeometry(dimLayerLeft);
var rectMeshLeft: THREE.Mesh = new THREE.Mesh(rectGeomLeft, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
rectMeshLeft.position.set(0, 0, 1);
(rectMeshLeft.material as THREE.Material).opacity = OPACITY_DIM;
scene.add(rectMeshLeft);

var dimLayerRight: THREE.Shape = new THREE.Shape();
dimLayerRight.moveTo(0, 0);
dimLayerRight.lineTo(0, -plotHeight);
dimLayerRight.lineTo(rectLength, -plotHeight);
dimLayerRight.lineTo(rectLength, 0);
// dimLayerRight.lineTo( 0, 0, 1);
dimLayerRight.lineTo(0, 0);

var rectGeomRight: THREE.ShapeGeometry = new THREE.ShapeGeometry(dimLayerRight);
var rectMeshRight: THREE.Mesh = new THREE.Mesh(rectGeomRight, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
rectMeshRight.position.set(plotWidth, 0, 1);
(rectMeshLeft.material as THREE.Material).opacity = OPACITY_DIM;
scene.add(rectMeshRight);

update();

export function update() {

    updateLinkGeometry();
    updateLinks();
    updateNodes();
    render();
}

export function updateLinkGeometry() {

    // var curve:THREE.Curve;
    // var path:THREE.Path;
    var splineObject: THREE.Line;
    var pointsPositiveTop: THREE.Vector2[];
    var pointsNegativeTop: THREE.Vector2[];
    var pointsPositiveBottom: THREE.Vector2[];
    var pointsNegativeBottom: THREE.Vector2[];
    var link: dynamicgraph.Link | undefined;
    var weights: number[] = [];
    var waveShape: WaveShape;
    // var geometry:THREE.Geometry;
    stepWidth = plotWidth / (endTime.id() - startTime.id());

    // stepWidth = 1;
    linkWeightScale.domain([0, Math.max(dgraph.links().weights().max(), dgraph.links().weights().min())]);
    for (var i = 0; i < waveShapes.length; i++) {
        if (waveShapes[i].positive)
            scene.remove(waveShapes[i].positive);
        if (waveShapes[i].negative)
            scene.remove(waveShapes[i].negative);
    }
    waveShapes = [];

    var isPositive: boolean;
    for (var i = 0; i < dgraph.links().length; i++) {

        link = dgraph.link(order[i].id);

        if (link)
            weights = link.weights(startTime, endTime).toArray();
        // create points
        pointsPositiveTop = [];
        pointsNegativeTop = [];
        pointsPositiveBottom = [];
        pointsNegativeBottom = [];

        isPositive = weights[0] >= 0;
        waveShape = new WaveShape();
        waveShapes.push(waveShape);

        pointsNegativeTop.push(new THREE.Vector2(0, 0));
        pointsNegativeBottom.push(new THREE.Vector2(0, 0));
        pointsPositiveTop.push(new THREE.Vector2(0, 0));
        pointsPositiveBottom.push(new THREE.Vector2(0, 0));


        for (var j = 0; j < weights.length; j++) {

            if (weights[j] == undefined) {
                // console.error('undefined')
                weights[j] = 0.1;
            }
            // console.log(weights[j])
            if (weights[j] >= 0 != isPositive) {

                // when changes from pos to neg or vice versa, insert base line point.
                pointsNegativeTop.push(new THREE.Vector2(stepWidth * (j - 1), 0));
                pointsNegativeBottom.push(new THREE.Vector2(stepWidth * (j - 1), 0));
                pointsPositiveTop.push(new THREE.Vector2(stepWidth * (j - 1), 0));
                pointsPositiveBottom.push(new THREE.Vector2(stepWidth * (j - 1), 0));
                isPositive = weights[j] >= 0;
            }
            if (weights[j] >= 0) {
                pointsPositiveTop.push(new THREE.Vector2(stepWidth * j, linkWeightScale(weights[j])));
                pointsPositiveBottom.push(new THREE.Vector2(stepWidth * j, -linkWeightScale(weights[j])));
            } else {
                pointsNegativeTop.push(new THREE.Vector2(stepWidth * j, linkWeightScale(-weights[j])));
                pointsNegativeBottom.push(new THREE.Vector2(stepWidth * j, -linkWeightScale(-weights[j])));
            }
        }
        pointsNegativeTop.push(new THREE.Vector2(stepWidth * j, 0));
        pointsNegativeBottom.push(new THREE.Vector2(stepWidth * j, 0));
        pointsPositiveTop.push(new THREE.Vector2(stepWidth * j, 0));
        pointsPositiveBottom.push(new THREE.Vector2(stepWidth * j, 0));


        if (pointsNegativeTop.length > 0) {
            // Create negative value curve without filling

            var curve: THREE.SplineCurve = new THREE.SplineCurve(pointsNegativeTop.concat(pointsNegativeBottom.reverse()));
            // var curve = new THREE.SplineCurve(pointsPositiveTop.concat(pointsPositiveBottom.reverse());
            var path: THREE.Path = new THREE.Path(curve.points);

            var geometry = path.createPointsGeometry(10); // NUMBER OF DIVISIONS ????

            var material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: COLOR_DEFAULT.getHex() });

            splineObject = new THREE.Line(geometry, material);
            // splineObject.position.y = -rowHeight*i-rowHeight/2;
            waveShape.negative = splineObject;
            scene.add(splineObject);
        }

        // // create positive value curve with black filling
        if (pointsPositiveTop.length > 0) {

            // create upper shape segments
            var curve: THREE.SplineCurve = new THREE.SplineCurve(pointsPositiveTop);
            var shape: THREE.Shape = new THREE.Shape(curve.points);
            var geometry: THREE.Geometry = new THREE.ShapeGeometry(shape);
            mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: COLOR_DEFAULT.getHex() }));

            // create lower shape segments
            curve = new THREE.SplineCurve(pointsPositiveBottom);
            shape = new THREE.Shape(curve.points);
            var geometry2: THREE.Geometry = new THREE.ShapeGeometry(shape);


            // merge both geometries
            // THREE.GeometryUtils.merge(geometry, geometry2);
            geometry.merge(geometry2);
            // create and add mesh
            // mesh = THREE.SceneUtils.createMultiMaterialObject( geometry, [ new THREE.MeshLambertMaterial( { color: 0xeeeeee } )] );
            mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: COLOR_DEFAULT.getHex() }));
            // mesh.position.y = -rowHeight*i-rowHeight/2;
            waveShape.positive = mesh;
            scene.add(mesh);
        }
    }
}

// update links after highlight or selection
var transition: animations.Transition;

export function updateLinks() {
    var links: any = dgraph.links().toArray();
    var l: dynamicgraph.Link;
    var j: any;
    transition = new animations.Transition(render)
    var color: any;
    var selections: any;
    for (var i = 0; i < links.length; i++) {
        l = links[i];

        // CHECK AND UPDATE VISIBILITY
        if (!l.isVisible()
            || !l.source.isVisible()
            || !l.target.isVisible()) {
            // remove from display
            if (waveShapes[l.id()].positive && waveShapes[l.id()].positive.material.opacity > 0) {
                transition.add(new animations.OpacityAnimation(
                    waveShapes[l.id()].positive,
                    0,
                    DURATION
                ));
            }
            if (waveShapes[l.id()].negative && waveShapes[l.id()].negative.material.opacity > 0) {
                transition.add(new animations.OpacityAnimation(
                    waveShapes[l.id()].negative,
                    0,
                    DURATION
                ));
            }
            continue;
        }
        // test whether not present already
        if (waveShapes[l.id()].positive && waveShapes[l.id()].positive.material.opacity == 0) {
            transition.add(new animations.OpacityAnimation(
                waveShapes[l.id()].positive,
                1,
                DURATION
            ));
        }
        if (waveShapes[l.id()].negative && waveShapes[l.id()].negative.material.opacity == 0) {
            transition.add(new animations.OpacityAnimation(
                waveShapes[l.id()].negative,
                1,
                DURATION
            ));
        }


        // update highlight and selection color
        color = undefined;
        if (l.isHighlighted()) {
            color = COLOR_HIGHLIGHT.getStyle();
        } else if (l.isSelected()) {
            color = utils.getPriorityColor(l);
        }
        if (!color)
            color = COLOR_DEFAULT.getHex();

        // set color
        if (waveShapes[l.id()].positive) {
            waveShapes[l.id()].positive.material.color = new THREE.Color(color);
        }
        if (waveShapes[l.id()].negative) {
            waveShapes[l.id()].negative.material.color = new THREE.Color(color);
        }
        // update wave position (e.g. after reordering):
        if (waveShapes[l.id()].positive) {
            transition.add(new animations.TranslationAnimation(
                waveShapes[l.id()].positive,
                waveShapes[l.id()].positive.position.x,
                -(rowHeight * visibleRank[l.id()] + rowHeight / 2),
                // 0,
                DURATION));
            // waveShapes[i].positive.position.y = -rowHeight*rank[i]-rowHeight/2;
        }
        if (waveShapes[l.id()].negative) {
            transition.add(new animations.TranslationAnimation(
                waveShapes[l.id()].negative,
                waveShapes[l.id()].negative.position.x,
                -(rowHeight * visibleRank[l.id()] + rowHeight / 2),
                // 0,
                DURATION));
            // waveShapes[i].negative.position.y = -rowHeight*rank[i]-rowHeight/2;
        }
    }

    transition.start();

    // update labels:
    d3.selectAll('.row')
        .attr('transform', (d: any, i: any) => {
            var pos_i = visibleRank[d.id()];
            if (pos_i > -1)
                return 'translate(0, ' + (plotMargin.y + rowHeight * (pos_i + .5) + 6) + ')';
            return 'translate(0, -100)'; // if not visible
        })
    // .transition()
    // .duration(500)
    // .style('opacity', function(d,i) {
    //     if (!d.isVisible()) {
    //         return 0;
    //     }
    //     else{
    //         return 1;
    //     }
    // });


}

export function updateNodes() {
    var color: any;
    var size: any;
    var n: any;
    d3.selectAll('.nodeLabel')
        .style('fill', function (d: any) {
            color = undefined;
            if (d.isHighlighted()) {
                color = COLOR_HIGHLIGHT.getStyle();
            } else if (d.isSelected()) {
                color = utils.getPriorityColor(d);
            }
            if (!color)
                color = COLOR_DEFAULT.getStyle();
            return color;
        })
        .style('font-size', function (d: any) {
            if (d.isHighlighted()) {
                size = 13;
            } else {
                size = 10;
            }
            return size;
        })

}



export function render() {
    // var d = new Date();
    // var begin = d.getTime()
    renderer.render(scene, camera)
    // d = new Date();
    // console.log('>>>> RENDERED ', (d.getTime() - begin), ' ms.');
}

var orderTimer: any;


export function updateRowHeight() {
    var rowHeightElement: any = document.getElementById("rowHeightInput");
    rowHeight = rowHeightElement ? parseInt(rowHeightElement.value) : 0; // IF rowHeightElement UNDEFINED??
    stretchFactorY = rowHeight / HIGHT_ROW_DEFAULT;
    // update row heights
    for (var i = 0; i < waveShapes.length; i++) {
        if (waveShapes[i].positive) {
            waveShapes[i].positive.scale.y = stretchFactorY;
            waveShapes[i].positive.position.y = -rowHeight * visibleRank[i] - rowHeight / 2;
        }
        if (waveShapes[i].negative) {
            waveShapes[i].negative.scale.y = stretchFactorY;
            waveShapes[i].negative.position.y = -rowHeight * visibleRank[i] - rowHeight / 2;
        }
    }
    render();

    d3.selectAll('.row')
        .attr('transform', (d: any, i: any) => {
            return 'translate(0, ' + (plotMargin.y + rowHeight * (visibleRank[i] + .5) + 6) + ')';
        });

}

export function updateRowOrdering() {
    // reorder will be launched after time has been left alone for a wile
    clearTimeout(orderTimer);
    orderTimer = setTimeout((e: any) => {
        console.log("sort");
        sortBySimilarity(4);
        updateLinks();
        render();
        orderTimer = null;
    }, 500);
}

export function dscsort(a: any, b: any) {
    return b.value - a.value;
}

export function ascsort(a: any, b: any) {
    return a.value - b.value;
}

export function sortBySimilarity(referenceIndex: any) {
    var data: number[][] = [];
    for (var i = 0; i < dgraph.links().length; i++) {
        var link: dynamicgraph.Link | undefined = dgraph.link(i);

        if (link)
            data[i] = link.weights(startTime, endTime).toArray();
    }
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            if (!data[i][j] || data[i][j] == undefined)
                data[i][j] = 0;
        }
    }
    var similarity: any = s.Sorting.sortBySimilarity(data, referenceIndex, "euclidean");
    for (var i = 0; i < order.length; i++) {
        order[i].value = similarity[order[i].id];
    }
    order.sort(dscsort);

    var str: string = "";
    for (var i = 0; i < order.length; i++) {
        rank[order[i].id] = i;
        str += order[i].id + ' ';
    }

    updateVisibleRank();
}

export function updateVisibleRank() {
    var link: any;
    var orderedLinks: any = dgraph.links().toArray().slice(0, dgraph.links().length);
    orderedLinks.sort(byRank);

    visibleRank = dynamicgraph.array(-1, orderedLinks.length);

    var visibleRankCount: number = 0;
    for (var i = 0; i < orderedLinks.length; i++) {
        link = orderedLinks[i]
        if (link.isVisible() && link.source.isVisible() && link.target.isVisible()) {
            visibleRank[link.id()] = visibleRankCount++;
        }
    }
}


export function timezoomCallback(min: dynamicgraph.Time, max: dynamicgraph.Time, single: dynamicgraph.Time, propagate: boolean) {

    stretchFactorX = dgraph.times().length / (endTimeZoom.id() - startTimeZoom.id());

    if ((endTimeZoom.id() - startTimeZoom.id()) != (max.id() - min.id())) {
        for (var i = 0; i < waveShapes.length; i++) {
            if (waveShapes[i].positive)
                waveShapes[i].positive.scale.x = stretchFactorX;
            if (waveShapes[i].negative)
                waveShapes[i].negative.scale.x = stretchFactorX;
        }
    }
    camera.position.x = plotWidth / 2 + (min.id() * stepWidth * stretchFactorX);

    startTimeZoom = min;
    endTimeZoom = max;

    render();
    updateRowOrdering();
    updateTimeSelection();

    timeZoomSlider.set(startTimeZoom.unixTime(), endTimeZoom.unixTime())
}

// updates the time band in the background to indicate selected times.
export function updateTimeSelection() {
    rectMeshLeft.position.x = (plotWidth / dgraph.times().length) * startTime.id() * stretchFactorX;
    rectMeshLeft.scale.x = stretchFactorX;
    rectMeshRight.position.x = (plotWidth / dgraph.times().length) * endTime.id() * stretchFactorX;
    rectMeshRight.scale.x = stretchFactorX;
}


// NETWORK CUBE HANDLERS


export function updateEvent(m: messenger.Message) {

    if (m.type == 'filter' || m.type == 'selectionFilter') {
        // not necessary every time!
        updateVisibleRank();
    }

    updateLinks()
    updateNodes()
    render();
}


export function timeRangeHandler(m: messenger.TimeRangeMessage) {
    // startTime = dgraph.time(m.startId);
    // endTime = dgraph.time(m.endId);

    // timeSlider.set(startTime, endTime);
    timeSlider.set(m.startUnix, m.endUnix);
    updateTimeSelection();

    updateRowOrdering();

    render();
}




// INTERACTION + LISTENERS
var hoveredLink: dynamicgraph.Link | undefined;
var lastClickMoment: any = window.performance.now();

export function mouseMove(e: any) {
    // sometimes we send a highlight too soon after a click, and
    // the selection gets lost, because this message will erase the
    // previous one. So we are going to give it some breathing room
    // Hopefully this is enough time for the other windows to get their
    // events from 'storage' and process them. else there are more 
    // robust ways of doing it, but they would require more clever code.
    if (window.performance.now() - lastClickMoment < 400) {
        return;
    }
    hoveredLink = undefined;
    var mpos = glutils.getMousePos(canvas, e.clientX, e.clientY)

    var hoveredLinkId = visibleRank.indexOf(Math.floor(mpos.y / rowHeight));

    if (dgraph.link(hoveredLinkId)) {
        hoveredLink = dgraph.link(hoveredLinkId);
        messenger.highlight('set',
            <utils.ElementCompound>{
                links: [hoveredLink],
            });
    } else {
        messenger.highlight('reset');
    }
}

export function click(e: any) {
    lastClickMoment = window.performance.now();

    if (hoveredLink) {
        if (!hoveredLink.isSelected(dgraph.getCurrentSelection())) {
            console.log('adding to selection', hoveredLink.source.label(), hoveredLink.target.label());
            messenger.selection('add', <utils.ElementCompound>{ links: [hoveredLink] });
        } else {
            messenger.selection('remove', <utils.ElementCompound>{ links: [hoveredLink] });
        }
    }
}


export function byRank(a: any, b: any) {
    return rank[a.id()] - rank[b.id()];
}
