import {Component, OnInit, EventEmitter} from '@angular/core';
import {Response} from '@angular/http';

import {BeetApi} from './apis.service';


@Component({
	selector:'criteria-list',
	templateUrl:'criterialist.component.html',
	inputs: ['list:list', 'label:label'],
	outputs: ['selectedElement']
})
export class CriteriaListComponent implements OnInit { 

	selectedElement: EventEmitter<string> = new EventEmitter<string>();

	label: string= 'undefined';

	list: string[];
	visible: boolean;

	constructor(){}

	ngOnInit(){	
		this.visible= false;
	}

	isVisible= () => this.visible;

	switchVisibility= () => this.visible= !this.visible;


	selectEntry= (index: number) => {
		this.selectedElement.next(this.list[index]);
		this.visible= false;
	}
	
}