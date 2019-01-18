/// <reference path="slider.ts" />

import * as d3 from 'd3'

export function makeSlider(
    d3parent: d3.Selection<d3.BaseType, {}, HTMLElement, any>, // ?????????????
    label: string,
    width: number,
    height: number,
    value: number,
    min: number,
    max: number,
    f: Function): void {

    var slider: Slider = new Slider(5, height - 5, width, min, max, .01);
    var svg = d3parent.append('svg')
        .attr('width', width + 20)
        .attr('height', height);

    svg.append('text')
        .attr('x', 10)
        .attr('y', height - 15)
        .text(label)
        .attr('class', 'sliderLabel');

    slider.appendTo(svg);
    slider.set(value);
    slider.setDragEndCallBack(f);
}

export class RadioButton {

    private checked: boolean = false;

    circle: d3.Selection<Element, Element, Element, Element>; // ?????????????
    label: d3.Selection<Element, Element, Element, Element>; // ?????????????

    color: string;
    text: string;

    RADIUS: number = 7;

    clickHandler: Function;

    constructor(color: string, text?: string) {
        this.color = color;
        this.text = text;
    }



    appendTo(x: number, y: number, svg: d3.Selection<Element, Element, Element, Element>) { // ?????????????
        var g = svg.append('g')
            .attr('transform', 'translate(' + x + ',' + y + ')');

        this.circle = g.append('circle')
            .attr('r', this.RADIUS)
            .attr('fill', '#ffffff')
            .attr('stroke', this.color)
            .attr('stroke-width', 1)
            .attr('cx', this.RADIUS * 2)
            .attr('cy', 0);


        if (this.text) {
            this.label = g.append('text')
                .attr('x', this.RADIUS * 1.4)
                .attr('y', 5)
                // .attr('x', 20)
                // .attr('y', 5)
                .style('font-family', 'Helvetica')
                .style('font-size', '9pt')
                .style('user-select', 'none')
                .text(this.text[0])
                .on('click', () => {
                    console.log(this.checked)
                    this.checked = !this.checked;
                    if (this.checked) {
                        this.circle.attr('fill', this.color);
                        this.label.attr('fill', '#ffffff');
                    } else {
                        this.circle.attr('fill', '#ffffff');
                        this.label.attr('fill', this.color);
                    }
                    if (this.clickHandler) {
                        this.clickHandler();
                    }
                });
        }
    }

    isChecked(): boolean {
        return this.checked;
    }

    addClickHandler(f: Function) {
        this.clickHandler = f;
    }
}


export function makeCheckBox(d3parent, label: string, callback: Function) {
    d3parent.append('input')
        .attr('type', 'checkbox')
        .on('change', callback);
    d3parent.append('b').attr('class', 'sliderLabel').html(label);
}

export function makeButton(d3parent, label: string, callback: Function) {
    d3parent.append('input')
        .attr('type', 'button')
        .attr('value', label)
        .on('click', callback);
}

