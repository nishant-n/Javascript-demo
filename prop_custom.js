// JavaScript Document custome developement By Cis
var MergeElementProperties ={}
var ElementProperties = Class.create(Enumerable,{
									 
    initialize: function (id) {
		
		
      this.id = id.toString();	
		this.labelId= 'label_'+this.id;
		this.inputId = 'input_'+this.id;
		this.elementType = this.getElementType();
		this.objectProperties = null;
		if(this.elementType=="control_button")
		{
			
			
		}

		$('temp').value= (this.elementType);
		
    },
	getElementType:function()
	{
		if(this.id != 'stage')
		{
			this.isForm = false;
			return ($('id_'+this.id).type);
		}
		else
		{
			this.isForm = true;
			return 'form';
			
		}
		//return this.id
	},
	getToolBar:function()
	{
		
		var flag = false;
		switch(this.elementType)	
		{
			case 'control_email':
			case 'control_phonenumber':
			case 'control_textbox':
				this.singleLineTextBox();
				flag = true;
			break;
			
			case 'control_button':
				flag = true;
				
				this.submitButtonBox();
			break;
			
			case 'control_checkbox':
				this.checkBoxBox();
				flag = true;
			break;
			
			case 'control_number':
				this.numberBox()
				flag = true;
			break;
			case 'control_fileupload':
			case 'control_paragraph':
			case 'control_head':
				this.headingBox();
				flag = true;
			break;
			
			
			case 'control_radio':
				this.radioButtonBox()
				flag = true;
			break;
			
			case 'control_dropdown':
				this.dropdownBox()
				flag = true;
			break;
			
			case 'control_money':
				this.numberBox()
				flag = true;
			break;
			case 'control_datetime':
				this.dateBox()
				flag = true;
			break;
			case 'control_textarea':
				this.singleLineTextBox()
				flag = true;
			break;
			
			default:
				flag = false;
				//this.singleLineTextBox();
				
			break;
			
		}
		return flag;
	},
	horizentalRow:function(){
			return '<tr><td colspan="100%" style="height:12px"><hr></td></tr>';
		},	
	topCommonBox:function(){
		var html ='';
		
		
		
		html += '<tr><td width="50%"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td>';
		
		if (this.objectProperties.field_size === undefined)
		{
			var containt='&nbsp;'
		}else{
			var containt='<div class="f-left single-input-fp"><label>'+'Field size'.locale()+this.getInfoWindow("Set the size of the fields".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_size,this.sizeOptionList(),'fieldSize','onchange="return setFieldSize(\''+this.id+'\',this,\''+this.elementType+'\')"')
		}
		
		html +='<td width="50%">'+containt+'</div></td></tr>';
		return html;
	},
	dateBox:function(){
		
		var html ='';
		html += '<table width="100%" border="0" class="element_prop" cellpadding="10" height="200">'
		html += this.connectToDatabase();
		 
		html += '<tr><td colspan="100%"><div class="f-left single-input-fp"><label>'+ 'Field Label'.locale() +this.getInfoWindow("Changes field label".locale())+'</label></div>';
		html += '<div class="f-left prop-common-pg-tp prop-single-row">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{class:'single-input-fp no-margin'})+'</div></td></tr>';
		
		//html += '<tr><td colspan="100%">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"')+'</td></tr>';
		
		html += '<tr><td width="50%"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div>'
		html += '<div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td>';
	
			//var containt='
		
		//alert(this.objectProperties.field_mask)
		html +='<td width="50%"><div class="f-left single-input-fp"><label>'+'Field Mask'.locale()+this.getInfoWindow("Sets date format".locale())+'</label></div>'
		html +='<div class="f-left prop-common-pg-tp single-input-fp">'+this.getSelectTag(this.objectProperties.field_mask,this.dateMaskOptionList(),'fieldSize','onchange="return setFieldMask(\''+this.id+'\',this)"')+'</div></td></tr>';
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row"><label>'+'Date range'.locale()+this.getInfoWindow("Defines minimum and maximum values permited.".locale())+'</label></div>';
			
			html +='<div class=" prop-left-col">'
				html += 'From'.locale()+': <div class="f-left single-input-fp label-div-pt ">'+this.inputText(this.objectProperties.from,"14",'onchange="return setDateRange(\''+this.id+'\',this)"',"set_from",{'class':"datepicker_datefield single-input-fp no-margin no-padding"})+'</div>'
			html +='</div>';		
			
			html +='<div class=" prop-right-col">'
				html +='To'.locale()+': <div class="f-right single-input-fp label-div-pt">'+this.inputText(this.objectProperties.to,"14",'onchange="return setDateRange(\''+this.id+'\',this)"',"set_to",{'class':"datepicker_datefield single-input-fp no-margin no-padding"})+'</div>';
			html +='</div>';	
			
		html +='</td></tr>';
		//html += '<tr><td colspan="100%"><label>Default Value '+this.getInfoWindow("Sets default value for the text field")+'</label></td></td></tr>';
		
		html += '<tr><td colspan="100%">'
			html +='<div class=" prop-single-row ">'
			
				html +='<label>'+'Default Date'.locale()+this.getInfoWindow("Default date will show in the text box")+'</label>'
			html +='</div>'	
			html +='<div class=" prop-single-row  prop-common-pg-tp">'
				html +='<div class="prop-left-col">'
					html += this.inputText((this.objectProperties.default_date ? this.objectProperties.default_value : ''),15,'','defaultDateInput',{"readonly":true,"class":"f-td-input no-margin"})
				html +='</div>'	
				
				html += '<div class="f-left">'+this.inputCheckBox('onchange ="isSetDefaultValue('+this.id+',this)"','chk_defaultdate',this.objectProperties.default_date)+'</div><div class="f-left">'+'Use current'.locale()+this.getInfoWindow("Sets the current date when filling the form as default date..")+'</div>';
			html +='</div>'
			
		html +=	'</td></tr>';
		//html += this.topCommonBox();
	//	alert(this.objectProperties.default_date)
//		var currentDate =()
		
		
		
		
//validate[required]
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Option'.locale()+this.getInfoWindow("Add field validation".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';
		//alert(this.objectProperties.required)
		html +=  '<div class="field-option-chk">'+this.inputCheckBox('onchange ="makeFieldRequire('+this.id+',this)"','chk_required',this.objectProperties.required)+'</div><div class="field-option-div">'+'Field is required'.locale()+this.getInfoWindow("Sets the field as required".locale())+'</div>';
		
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isDuplicate('+this.id+',this)"','chk_noduplicate',this.objectProperties.allow_duplicate)+'</div><div class="field-option-div">'+''+'No duplicates allowed'.locale()+this.getInfoWindow("Doesn't allow user to insert a value already inserted on the data table. Applied to unique fields like user login or e-mail".locale())+'</div>';
		
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isUserLogged('+this.id+',this)"','chk_userlogged',this.objectProperties.loged_user)+'</div><div class="field-option-div">'+'Show field to logged user only'.locale()+this.getInfoWindow("Field will be displayed only to NG logged users".locale())+'</div></div></td></tr>';
		
			html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Instructions'.locale()+this.getInfoWindow("Field hint displayed on the right of the field".locale())+'</label></div>';
		
		html += '<div class=" prop-single-row prop-common-pg-tp">'+this.textArea('hint_desc',this.objectProperties.hint_desc,4,30,'onchange="return setHintDescription(\''+this.id+'\',this)"')+'</div></td></tr>';

		html += '</table>';
		
		//html += this.getFieldType("");	 
		//alert(html)
		$('toolbarnew').setText(html);
		addDatePicker('datepicker_datefield')
	},
	dropdownBox:function(){
		
		var html ='';
		html += '<table width="100%" border="0" class="element_prop" height="100%">';
		html += this.connectToDatabase();

		//html += '<tr><td colspan="100%"><label>Field Label'+this.getInfoWindow("Changes field label")+'</label>' +this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"')+'</td></tr>';
		
		html += '<tr><td colspan="100%"><label>' +'Field Label'.locale()+this.getInfoWindow("Changes field label".locale())+'</label>'		
		html +='<div class="f-left single-input-fp label-div-pt">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{class:'single-input-fp no-margin'})+'</div></td></tr>';
		
		
		
		
		//html += '<tr><td width="45%"><label>Field type '+this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label>'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</td>';		
	//	html +='<td width="55%" ><label>Options columns'+this.getInfoWindow("Sets the number of columns the field number of columns the field options will be displayed.")+'</label>'+this.getSelectTag(this.objectProperties.column,this.columnOptionList(),'fieldSize','onchange="return false"')+'</td></tr>';
		
		
		html += '<tr><td width="50%"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td>'
		
		html += '<td width="50%" style="visibility:hidden"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td></tr>';
		
		
		
		html += this.horizentalRow();
		
		//html += '<tr><td colspan="100%">'+this.inputCheckBox('onclick ="makeSelectionLimit('+this.id+',this)"','limit_selection_chk',this.objectProperties.isLimitCheckBox)+'Limit number of selections per options '+this.getInfoWindow("Per options sets the sets the maximum number of times one of the alternatives can be choose before becoming desabled")+'</td></tr>';
		
		
		html += '<tr><td colspan="100%" class="no-padding-bottom dispaly-none"><div class="field-option-chk">'+this.inputCheckBox('onclick ="makeSelectionLimit('+this.id+',this)"','limit_selection_chk',this.objectProperties.isLimitCheckBox)+'</div><div class="field-option-div">Limit number of selections per options '+this.getInfoWindow("Per options sets the sets the maximum number of times one of the alternatives can be choose before becoming desabled")+'</div></td></tr>';
		
		
		
		var styleLimit ='';
		var styleAlt ='';
			if(this.objectProperties.isLimitCheckBox)
			{
				styleLimit="display:block";
				styleAlt="width:70%"
			}
		html += '<tr><td colspan="100%" class="no-padding-bottom">'
			html +='<div id="chk_opt_alt" style="'+styleAlt+'"><label> '+'Alternatives'.locale()+this.getInfoWindow("Options to be displayed on form".locale())+'</label>';
			
				html += '<table width="200" border="0" class="element_prop" cellpadding="10" height="100%">';
						html += '<tr><td colspan="100%">'+this.objectProperties.options_list+'</td></tr>';
						
				html +='</table>'
			html+='</div>';
			
				
			html +='<div id="chk_opt_lim" style="'+styleLimit+'"><div class="alternative-lebel-div "><label class="no-padding">Limit '+this.getInfoWindow("Define the field limit.Since the defined number is reach, the question remains active, but that question becomes disabled")+'</label></div>';
				html += '<table width="100%" border="0" class="element_prop" cellpadding="10" height="100%">';
						html += '<tr><td colspan="100%">'+this.objectProperties.options_prop_list+'</td></tr>';
						
				html +='</table>'
			html +='</div>';
			
		html +=	'</td></tr>';
		
		html += '<tr><td colspan="100%" align="center" class="no-padding-top"><a class="alt_list" onclick="importListFormOpen(\''+this.objectProperties.field_type+'\')">'+'Import Alternatives List'.locale()+'</a></td></tr>';
		
		html += this.horizentalRow();
		
			
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Option'.locale()+this.getInfoWindow("Add field validation".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';
		//alert(this.objectProperties.required)
		html +=  '<div class="field-option-chk">'+this.inputCheckBox('onchange ="makeFieldRequire('+this.id+',this)"','chk_required',this.objectProperties.required)+'</div><div class="field-option-div">'+'Field is required'.locale()+this.getInfoWindow("Sets the field as required".locale())+'</div>';
				
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isUserLogged('+this.id+',this)"','chk_userlogged',this.objectProperties.loged_user)+'</div><div class="field-option-div">'+'Show field to logged user only'.locale()+this.getInfoWindow("Field will be displayed only to NG logged users".locale())+'</div></div></td></tr>';
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Instructions'.locale()+this.getInfoWindow("Field hint displayed on the right of the field".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';
		html += this.textArea('sub_heading',this.objectProperties.sub_heading,4,30,'onkeyUp="return setHintDescription(\''+this.id+'\',this)"')+'</div></td></tr>';

		html += '</table>';
		
		$('toolbarnew').setText(html);
		
		
	},
	radioButtonBox:function(){
		var html ='';
		html += '<table width="100%" border="0" class="element_prop" height="100%">';
		html += this.connectToDatabase();

		//html += '<tr><td colspan="100%"><label>Field Label'+this.getInfoWindow("Changes field label")+'</label>' +this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"')+'</td></tr>';

		
		
		html += '<tr><td colspan="100%"><label>'+ 'Field Label'.locale() +this.getInfoWindow("Changes field label".locale())+'</label>'
		
		html +='<div class="f-left single-input-fp label-div-pt">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{class:'single-input-fp no-margin'})+'</div></td></tr>';
		
		
		//html += '<tr><td width="45%"><label>Field type '+this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label>'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</td>';
		
		//html +='<td width="55%"><label>Options columns'+this.getInfoWindow("Sets the number of columns the field number of columns the field options will be displayed.")+'</label>'+this.getSelectTag(this.objectProperties.column,this.columnOptionList(),'fieldSize','onchange="return setSpreadCols(\''+this.id+'\',this)"')+'</td></tr>';
		
			html += '<tr><td width="50%"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td>'
		
		html += '<td width="50%"><div class="f-left single-input-fp"><label>Options columns'+this.getInfoWindow("Sets the number of columns the field number of columns the field options will be displayed.")+'</label></div>'
		html += '<div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.column,this.columnOptionList(),'fieldSize','onchange="return setSpreadCols(\''+this.id+'\',this)"')+'</div></td></tr>';
		
		
		
		html += this.horizentalRow();
		
		//html += '<tr><td colspan="100%">'+this.inputCheckBox('onclick ="makeSelectionLimit('+this.id+',this)"','limit_selection_chk',this.objectProperties.isLimitCheckBox)+'Limit number of selections per options '+this.getInfoWindow("Per options sets the sets the maximum number of times one of the alternatives can be choose before becoming desabled")+'</td></tr>';
		
		html += '<tr><td colspan="100%"  class="no-padding-bottom dispaly-none"><div class="field-option-chk">'+this.inputCheckBox('onclick ="makeSelectionLimit('+this.id+',this)"','limit_selection_chk',this.objectProperties.isLimitCheckBox)+'</div><div class="field-option-div">Limit number of selections per options '+this.getInfoWindow("Per options sets the sets the maximum number of times one of the alternatives can be choose before becoming desabled")+'</div></td></tr>';
		
		
		var styleLimit ='';
		var styleAlt ='';
			if(this.objectProperties.isLimitCheckBox)
			{
				styleLimit="display:block";
				styleAlt="width:70%"
			}
		html += '<tr><td colspan="100%" class="no-padding-bottom">'
			html +='<div id="chk_opt_alt" style="'+styleAlt+'"><label>'+'Alternatives'.locale()+this.getInfoWindow("Options to be displayed on form".locale())+'</label>';
			
				html += '<table width="200" border="0" class="element_prop" cellpadding="10" height="100%">';
						html += '<tr><td colspan="100%">'+this.objectProperties.options_list+'</td></tr>';
						
				html +='</table>'
			html+='</div>';
			
				
			html +='<div id="chk_opt_lim" style="'+styleLimit+'"><div class="alternative-lebel-div "><label class="no-padding">Limit '+this.getInfoWindow("Define the field limit.Since the defined number is reach, the question remains active, but that question becomes disabled")+'</label></div>';
				html += '<table width="100%" border="0" class="element_prop" cellpadding="10" height="100%">';
						html += '<tr><td colspan="100%">'+this.objectProperties.options_prop_list+'</td></tr>';
						
				html +='</table>'
			html +='</div>';
			
		html +=	'</td></tr>';
		
		html += '<tr><td colspan="100%" align="center" class="no-padding-top"><a class="alt_list" onclick="importListFormOpen(\''+this.objectProperties.field_type+'\')">'+'Import Alternatives List'.locale()+'</a></td></tr>';
		
		html += this.horizentalRow();
		
			
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Option'.locale()+this.getInfoWindow("Add field validation".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';
		//alert(this.objectProperties.required)
		html +=  '<div class="field-option-chk">'+this.inputCheckBox('onchange ="makeFieldRequire('+this.id+',this)"','chk_required',this.objectProperties.required)+'</div><div class="field-option-div">'+'Field is required'.locale()+this.getInfoWindow("Sets the field as required".locale())+'</div>';
				
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isUserLogged('+this.id+',this)"','chk_userlogged',this.objectProperties.loged_user)+'</div><div class="field-option-div">'+'Show field to logged user only'.locale()+this.getInfoWindow("Field will be displayed only to NG logged users".locale())+'</div></div></td></tr>';
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Instructions'.locale()+this.getInfoWindow("Field hint displayed on the right of the field".locale())+'</label></div>';
		
		html += '<div class=" prop-single-row prop-common-pg-tp">'+this.textArea('sub_heading',this.objectProperties.sub_heading,4,30,'onkeyUp="return setHintDescription(\''+this.id+'\',this)"')+'</div></td></tr>';

		html += '</table>';
		
		$('toolbarnew').setText(html);
		
		},
	checkBoxBox:function(){

		var html ='';
		html += '<table width="100%" border="0" class="element_prop" height="100%">';
		html += this.connectToDatabase();
		//html += '<tr><td colspan="100%"><label>Field Label'+this.getInfoWindow("Changes field label")+'</label></td></tr>';
		html += '<tr><td colspan="100%"><label>'+'Field Label'.locale()+this.getInfoWindow("Changes field label".locale())+'</label>'
		
		html +='<div class="f-left single-input-fp label-div-pt">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{class:'single-input-fp no-margin'})+'</div></td></tr>';

		
	/*	html += '<tr><td width="45%"><label>Field type '+this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label>'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</td>';
		
		html +='<td width="55%"><label>Options columns'+this.getInfoWindow("Sets the number of columns the field number of columns the field options will be displayed.")+'</label>'+this.getSelectTag(this.objectProperties.column,this.columnOptionList(),'fieldSize','onchange="return setSpreadCols(\''+this.id+'\',this)"')+'</td></tr>';*/
		
		
		html += '<tr><td width="50%"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td>'
		
		html += '<td width="50%"><div class="f-left single-input-fp"><label>Options columns'+this.getInfoWindow("Sets the number of columns the field number of columns the field options will be displayed.")+'</label></div>'
		html += '<div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.column,this.columnOptionList(),'fieldSize','onchange="return setSpreadCols(\''+this.id+'\',this)"')+'</div></td></tr>';
		
		
		
		html += this.horizentalRow();
		
		html += '<tr><td colspan="100%"  class="no-padding-bottom dispaly-none" ><div class="field-option-chk">'+this.inputCheckBox('onclick ="makeSelectionLimit('+this.id+',this)"','limit_selection_chk',this.objectProperties.isLimitCheckBox)+'</div><div class="field-option-div">Limit number of selections per options '+this.getInfoWindow("Per options sets the sets the maximum number of times one of the alternatives can be choose before becoming desabled")+'</div></td></tr>';
		var styleLimit ='';
		var styleAlt ='';
			if(this.objectProperties.isLimitCheckBox)
			{
				styleLimit="display:block";
				styleAlt="width:70%"
			}
		html += '<tr><td colspan="100%" class="no-padding-bottom">'
			html +='<div id="chk_opt_alt" style="'+styleAlt+'"><label> '+'Alternatives'.locale()+this.getInfoWindow("Options to be displayed on form".locale())+'</label>';
			
				html += '<table width="200" border="0" class="element_prop" cellpadding="10" height="100%">';
						html += '<tr><td colspan="100%">'+this.objectProperties.options_list+'</td></tr>';
						
				html +='</table>'
			html+='</div>';
			
				
			html +='<div id="chk_opt_lim" style="'+styleLimit+'"><div class="alternative-lebel-div "><label class="no-padding">Limit '+this.getInfoWindow("Define the field limit.Since the defined number is reach, the question remains active, but that question becomes disabled")+'</label></div>';
				html += '<table width="100%" border="0" class="element_prop" cellpadding="10" height="100%">';
						html += '<tr><td colspan="100%">'+this.objectProperties.options_prop_list+'</td></tr>';
						
				html +='</table>'
			html +='</div>';
			
		html +=	'</td></tr>';
		
		html += '<tr><td colspan="100%" align="center" class="no-padding-top"><a class="alt_list" onclick="importListFormOpen(\''+this.objectProperties.field_type+'\')">'+'Import Alternatives List'.locale()+'</a></td></tr>';
		
		html += this.horizentalRow();
		
			
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Option'.locale()+this.getInfoWindow("Add field validation".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';

		//alert(this.objectProperties.required)
		html +=  '<div class="field-option-chk">'+this.inputCheckBox('onchange ="makeFieldRequire('+this.id+',this)"','chk_required',this.objectProperties.required)+'</div><div class="field-option-div">'+'Field is required'.locale()+this.getInfoWindow("Sets the field as required".locale())+'</div>';
				
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isUserLogged('+this.id+',this)"','chk_userlogged',this.objectProperties.loged_user)+'</div><div class="field-option-div">'+'Show field to logged user only'.locale()+this.getInfoWindow("Field will be displayed only to NG logged users".locale())+'</div></div></td></tr>';
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Instructions'.locale()+this.getInfoWindow("Field hint displayed on the right of the field".locale())+'</label></div>';
		
		html += '<div class=" prop-single-row prop-common-pg-tp">'+this.textArea('sub_heading',this.objectProperties.sub_heading,4,30,'onkeyUp="return setHintDescription(\''+this.id+'\',this)"')+'</div></td></tr>';

		html += '</table>';
		
		$('toolbarnew').setText(html);
	
	
	},
	numberBox:function(){
	 
		var html ='';

		html += '<table width="100%" border="0" class="element_prop" cellpadding="10" height="200">'		
		
		html += this.connectToDatabase();
		
		html += '<tr><td colspan="100%"><div class="f-left single-input-fp"><label>'+'Field Label'.locale()+this.getInfoWindow("Changes field label".locale())+'</label></div>';
		html += '<div class="f-left prop-common-pg-tp  prop-single-row">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{class:'single-input-fp no-margin'})+'</div></td></tr>';
		
		//html += '<tr><td colspan="100%"><label>Field Label'+this.getInfoWindow("Changes field label")+'</label></td></tr>';
		//html += '<tr><td colspan="100%">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"')+'</td></tr>';
		html += this.topCommonBox();		
		
		html += '<tr><td ><div class="prop-single-row"><label>Values range '+this.getInfoWindow("Defines minimum and maximum values permited. Keeping this fields empty allows user to insert any value, including negative ones. To allow only positive values, set inicial value to 0 (zero)".locale())+'</label></div>';
			
			html +='<div class="prop-single-row label-div-pt">'
				html += 'From'.locale()+': <div class="f-left single-input-fp label-div-pt">'+this.inputText(this.objectProperties.from,"16",'onkeyUp="return setNumberRange(\''+this.id+'\',this)"',"set_from",{'class':"single-input-fp no-margin no-padding"})+'</div>'
			html +='</div></td>';		
			
			html +='<td><div class="prop-single-row">'
				html +=' <div class="prop-single-row" style="visibility:hidden"><label>Values range</div>'+'To'.locale()+': <div class="f-left single-input-fp prop-common-pg-tp">'+this.inputText(this.objectProperties.to,"16",'onkeyUp="return setNumberRange(\''+this.id+'\',this)"',"set_to",{'class':"single-input-fp"})+'</div>';
			html +='</div>';	
			
		html +='</td></tr>';
		
	

	/*	html +='<td> To:'+this.inputText(this.objectProperties.to,"16",'onkeyUp="return setNumberRange(\''+this.id+'\',this)"',"set_to")+'</td></tr>';
		
		//html += '<tr><td colspan="100%"><label>Default Value '+this.getInfoWindow("Sets default value for the text field")+'</label></td></td></tr>';
		*/
	//	html += '<tr><td colspan="100%"><label>Default Value '+this.getInfoWindow("Sets default value for the text field")+'</label>'+this.inputText(this.objectProperties.default_value,38,'onkeyUp="return setDefaultVaue(\''+this.id+'\',this)"',{'class':"datepicker_datefield datepicker_datefield_input"})+'</td></tr>';

html += '<tr><td colspan="100%">'
			html +='<div class=" prop-single-row ">'
			
				html +='<label>'+'Default Value'.locale()+this.getInfoWindow("Sets default value for the text field".locale())+'</label>'
			html +='</div>'	
			html +='<div class=" prop-single-row  prop-common-pg-tp">'
				
					html += this.inputText(this.objectProperties.default_value,38,'onkeyUp="return setDefaultVaue(\''+this.id+'\',this)"',undefined,{'class':"datepicker_datefield single-input-fp no-margin"})
			
			html +='</div>'
			
		html +=	'</td></tr>';
		
		
		//html += '<tr><td><label>Field Mask '+this.getInfoWindow("Sets the field mask".locale())+'</label></td><td width="50%"><label>Decimal place '+this.getInfoWindow("Defines the number of places after the number of places after the comma.")+'</label></td></tr>';
		
		html += '<tr>';
		html +='<td width="50%"><div class="f-left single-input-fp">'
		
		if (this.objectProperties.field_type == "control_number")
		{
			html +='<label>'+'Field Mask'.locale()+this.getInfoWindow("Sets the field mask".locale())+'</label></div>';
				
				html += '<div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_mask,{},'fieldMask','onchange="return setFieldMask(\''+this.id+'\',this)"');
				
		}else{
			
			html +='<label>Currency '+this.getInfoWindow("Defines the format of currency.")+'</label></div>';
				html +='<div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.currency_format,this.getCurrencyFormatList(),'fieldCurrency','onchange="return setFieldMask(\''+this.id+'\',this)"');
		}
			html +='</div></td>'	;
		
		html +='<td width="50%"><div class="f-left single-input-fp"><label>Decimal place '+this.getInfoWindow("Defines the number of places after the comma".locale())+'</label></div>'
		html +='<div class="f-left single-input-fp prop-common-pg-tp">'+this.inputText(this.objectProperties.decimalPosition,"16",'onkeyUp="return setDecimalPlace(\''+this.id+'\',this)"',"set_to",{class:'single-input-fp'})+'</div></td></tr>';




//validate[required]
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Option'.locale()+this.getInfoWindow("Add field validation".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';
		//alert(this.objectProperties.required)
		html +=  '<div class="field-option-chk">'+this.inputCheckBox('onchange ="makeFieldRequire('+this.id+',this)"','chk_required',this.objectProperties.required)+'</div><div class="field-option-div">'+'Field is required'.locale()+this.getInfoWindow("Sets the field as required".locale())+'</div>';
		
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isDuplicate('+this.id+',this)"','chk_noduplicate',this.objectProperties.allow_duplicate)+'</div><div class="field-option-div">'+'No duplicates allowed'.locale()+this.getInfoWindow("Doesn't allow user to insert a value already inserted on the data table. Applied to unique fields like user login or e-mail".locale())+'</div>';
		
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isUserLogged('+this.id+',this)"','chk_userlogged',this.objectProperties.loged_user)+'</div><div class="field-option-div">'+'Show field to logged user only'.locale()+this.getInfoWindow("Field will be displayed only to NG logged users".locale())+'</div>';
		//alert(this.objectProperties.number_text_aligned)
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="valueAlignment('+this.id+',this)"','chk_righ_align',this.objectProperties.number_text_aligned)+'</div><div class="field-option-div">'+'Right Aligned'.locale()+this.getInfoWindow("Displays the values right aligned.".locale())+'</div></div></td></tr>';
		
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Instructions'.locale()+this.getInfoWindow("Field hint displayed on the right of the field".locale())+'</label></div>';
		
		html += '<div class=" prop-single-row prop-common-pg-tp">'+this.textArea('hint_desc',this.objectProperties.hint_desc,4,30,'onkeyUp="return setHintDescription(\''+this.id+'\',this)"')+'<div></td></tr>';

		html += '</table>';
		
		$('toolbarnew').setText(html);
		
		this.numberMaskOptionList()
		//$('toolbarnew').setAttribute('style','border:solid 1px red')
		
	},
	headingBox:function(){
		
		var html ='';
		html += '<table width="100%" border="0" class="element_prop" cellpadding="10" height="100%">';
		html += this.connectToDatabase();
		html += '<tr><td colspan="100%"><div class="f-left"><label>'+'Field Label'.locale()+this.getInfoWindow("Changes field label".locale())+'</label></div>';
		html += '<div class="f-left prop-common-pg-tp single-input-fp">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{'class':"single-input-fp"})+'<div></td></tr>';
		
		html += '<tr><td width="50%"><div class="f-left single-input-fp"><label>'+'Field type'.locale() + this.getInfoWindow("Sets field type. Each field type has unique properties and defines the kind of information user can input".locale())+'</label></div><div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_type,this.fieldTypeList(),'fieldType')+'</div></td>'
		var fname = 'setFontSize'
		if (this.objectProperties.field_type !="control_fileupload")
		{
			html += '<td width="50%"><div class="f-left single-input-fp"><label>Title size'+this.getInfoWindow("Sets the font size for the field title".locale())+'</label></div>'
		}
		else
		{
			html += '<td width="50%"><div class="f-left single-input-fp"><label>'+'Field size'.locale()+this.getInfoWindow("Sets the font size for the field title".locale())+'</label></div>';
			var fname = 'setFieldSize'
		}
		html += '<div class="f-left single-input-fp prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.font_size,this.textSizeOptionList(),'fieldSize','onchange="return '+fname+'(\''+this.id+'\',this)"')+'</div></td></tr>';
		
//		html += '<tr><td width="50%">'++'</td><td width="50%">'++'</td></tr>';
		//html += this.topCommonBox();

		
		html += '<tr><td colspan="100%"> <div class="f-left"><label>Description'+this.getInfoWindow('Sets the font size for the text below the title')+'</label></div><div class="f-left prop-common-pg-tp f-td-input">'+this.textArea('sub_heading',(this.objectProperties.sub_heading.replace(/<br\/\>/g,"\n").replace(/<br>/g,"\n")),4,30,'onkeyUp="return setSubHeading(\''+this.id+'\',this)"')+' </div></td></tr>'; 
		
		//html += '<tr><td colspan="100%">'+this.textArea('sub_heading',this.objectProperties.sub_heading,4,30,'onkeyUp="return setSubHeading(\''+this.id+'\',this)"')+'</td></tr>';

		html += '</table>';
		
		$('toolbarnew').setText(html);
	},
	textAreaBox:function(){
		
		
	},
	singleLineTextBox:function(){
		var html ='';
		html += '<table width="100%" border="0" class="element_prop" cellpadding="10">'
		html += this.connectToDatabase();
			
		html += '<tr><td colspan="100%"><label>'+'Field Label'.locale()+this.getInfoWindow("Changes field label".locale())+'</label>'		
		html +='<div class="f-left single-input-fp label-div-pt">'+this.inputText(this.objectProperties.field_label,38,'onkeyUp="return changeLabel(\''+this.id+'\',this)"',undefined,{class:'single-input-fp no-margin'})+'</div></td></tr>';
		
				
		html += this.topCommonBox();
		
		if (this.objectProperties.max_length !== undefined){
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Max Characters'.locale()+this.getInfoWindow("Sets the maximum number of characteres accepted for the field".locale())+'</label></div>';
		
		html += '<div class="single-half-coulmn  prop-common-pg-tp">'+this.inputText(this.objectProperties.max_length,"15",'onkeyUp="return setMaxLength(\''+this.id+'\',this)"',undefined,{class:'f-td-input no-margin'})+'</div></td></tr>';
		}
		
		if (this.objectProperties.field_type == "control_phonenumber")
		{
			
			html +='<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Mask'.locale()+this.getInfoWindow("Sets the field mask".locale())+'</label></div>'
			html +='<div class="single-half-coulmn prop-common-pg-tp">'+this.getSelectTag(this.objectProperties.field_mask,this.phoneNumberMaskOptionList(),'fieldMask','onchange="return setFieldMask(\''+this.id+'\',this)"')+'</div></td></tr>';
			
		}
		
		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Default Value'.locale() + this.getInfoWindow("Sets default value for the text field".locale())+'</label></div>';
		
		html += '<div class=" prop-single-row prop-common-pg-tp">'+this.inputText(this.objectProperties.default_value,15,'onkeyUp="return setDefaultVaue(\''+this.id+'\',this)"',undefined,{class:'f-td-input'})+'</div></td></tr>';


		html += '<tr><td colspan="100%"><div class=" prop-single-row "><label>'+'Field Option'.locale()+this.getInfoWindow("Add field validation".locale())+'</label></div>';
		html += '<div class=" prop-single-row prop-common-pg-tp">';

		html +=  '<div class="field-option-chk">'+this.inputCheckBox('onchange ="makeFieldRequire('+this.id+',this)"','chk_required',this.objectProperties.required)+'</div><div class="field-option-div">'+'Field is required'.locale()+this.getInfoWindow("Sets the field as required".locale())+'</div>';
		
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isDuplicate('+this.id+',this)"','chk_noduplicate',this.objectProperties.allow_duplicate)+'</div><div class="field-option-div">'+'No duplicates allowed'.locale()+this.getInfoWindow("Doesn't allow user to insert a value already inserted on the data table. Applied to unique fields like user login or e-mail".locale())+'</div>';
		
		html += '<div class="field-option-chk">'+this.inputCheckBox('onchange ="isUserLogged('+this.id+',this)"','chk_userlogged',this.objectProperties.loged_user)+'</div><div class="field-option-div">'+'Show field to logged user only'.locale()+this.getInfoWindow("Field will be displayed only to NG logged users".locale())+'</div></div></td></tr>';
		
		html += '<tr><td colspan="100%"><div class="prop-single-row "><label>'+'Field Instructions'.locale()+this.getInfoWindow("Field hint displayed on the right of the field".locale())+'</label></div>';
		
		html += '<div class="prop-single-row prop-common-pg-tp">'+this.textArea('hint_desc',this.objectProperties.hint_desc,4,30,'onchange="return setHintDescription(\''+this.id+'\',this)"')+'</div></td></tr>';

		html += '</table>';
		

		$('toolbarnew').setText(html);
		
	
		
	},
	connectToDatabase:function(){
		
		var html ='';
		if(isChildForm && this.objectProperties.association)
		{
			//alert(this.objectProperties.dbfield_name)
			html += '<tr><td colspan="100%" style="color: red;" class="no-padding-bottom">'+'Connected to field'.locale()+ '<img class="connect_field_img" src="/sistema/images/builder/icon_next.gif"> datatabe '+this.getInfoWindow("Displays the related data table - data inserted trought this field will be stored on this data table")+'</td></tr>';
			html += '<tr><td colspan="100%" style="color:gray;padding-left:10px"> '+this.objectProperties.dbname+'<img class="connect_field_img" src="/sistema/images/builder/icon_next.gif">'+ this.objectProperties.dbfield_name+'</td></tr>';
		}
		
		return html;
		
	},
	submitButtonBox:function(){
		
		var html ='';
		html +='<table width="100%" border="0" class="element_prop" cellpadding="10" >'
		html += '<tr><td colspan="100%">'
		html +='No properties...Click on Form<br> To change the label of submit button..'
		html +='<td></tr>';
		html += '</table>';
		$('toolbarnew').setText(html);
		
		//unselectField();
	},
	textArea:function(id,desc,rows,columns,funcName){
		
		var functionName='';
		var txtAreaId = id ? ' id="'+id+'" ':'';
		
		if(funcName!='')
			functionName = funcName;
	
		return '<textarea style="width:96%" cols="'+columns+'" rows="'+rows+'"  '+functionName+'>'+desc+'</textarea>';
			
	},
	inputText:function(value,size,funcName,id,propObj)
	{
		var functionName='';
		var idName='';
		var prop ='';
		if(id){idName =' id="'+id+'" '}
			
		if(funcName!='')
			functionName = funcName;
		if(propObj)
			for(i in propObj)
				prop +=i +'="'+propObj[i]+'" '
				
		
		return '<input type="text" size="'+size+'"'+prop+' value="' +value+'" '+functionName+ idName+'>';
	},
	inputCheckBox:function(funcName,id,isChecked)
	{
		
		var chkId = id ? ' id="'+id+'" ':'';	
		var checked = '';		
		if(isChecked)
			{
				
				checked = 'checked = "checked"'
				//alert(checked)
			}
		var functionName='';
		if(funcName!='')
		{	
			functionName = funcName //+'(\''+this.id+'\',this)';
			//alert(functionName)
		}
		return '<input type="checkbox"'+ functionName + chkId+ checked+ '">';
	},
    setProperties: function () {
		
	},
	getInfoWindow:function(title)
		{
			
			//new Tip(id, 'content', {title: 'this tooltip has a title'});			
			return '&nbsp; <a class="tipnew" title="'+title+'" onclick="notImpliment()" style="color: #000000;cursor:pointer">(?)</a>'	
			
		},
	getCurrencyFormatList:function(){
			return CURRENCIES;
			//return  {"":"-","usdollar":"U$-US dollar","EUR":"Euro","CAD":"Canadian Dollar"};	
		},	
	getSelectTag:function(selected,fieldList,id,funcName){
			
		var html='';
		var defaultSelected;
		var selId = id ? ' id="'+id+'" ':'';		
		var opt ='';
		var selectedField ='';
		var functionName=''
		if(funcName)
			functionName = funcName;
		//alert(selected)	
		for(i in fieldList)
		{
			if(selected)
				{
					if(i==selected)
						{
							
							selectedField ='selected="selected"';
						}
					else
					{
						selectedField ='';
						}
				}
			opt +='<option value="'+i+'" '+selectedField + '>'+fieldList[i]+'</option>'
		}
		
	//	if (this.objectProperties.field_type == "control_phonenumber" && id=="fieldMask")
		//	html +='<div class="temp"><select style="width:136px"'+ functionName + selId+'>'+opt+'</select></div>'
		//else
			html +='<div class="temp"><select style="width:98%"'+ functionName + selId+'>'+opt+'</select></div>'
		return html;		
				
	},
	dateMaskOptionList:function(){
			var list = {"0" :"< No mask >"};
			
			return mergerObject(list,MASK_LIST[this.objectProperties.field_type])
		},
	phoneNumberMaskOptionList:function(){
			var list = {"0" :"< No mask >"};
			
			return mergerObject(list,MASK_LIST[this.objectProperties.field_type])
			
			//return  {"0":"< No mask >","#### #### ####":" #### #### ####","(##) #### ####":" (##) #### ####","(## ##)#### ####":"(## ##) #### ####"};
		},
	numberMaskOptionList:function(){
		
			var localObjTmp = this
			
			//alert(MASK_LIST[this.objectProperties.field_type])
			var maskList = MASK_LIST[this.objectProperties.field_type]
				
                try {
					var theSelectList = $('fieldMask');
						
					var isSelected= false;
					AddSelectOption(theSelectList, '--', 0, true);	
					
					for(i in maskList)
						{
							//var myNewOption = new Option(t.responseJSON[i], i,i==15?true:false);							
							
							//theSelectList.selectedIndex = insertNewOption(myNewOption, theSelectList);				

								if( localObjTmp.objectProperties.field_mask &&  i == localObjTmp.objectProperties.field_mask)
								{
									isSelected = true
										
								}
								else
								isSelected = false
									//alert(t.responseJSON[i])
								
								AddSelectOption(theSelectList, maskList[i], i, isSelected);
								//alert(this.id)//field_mask
								
								isSelected?setFieldMask(localObjTmp.id,theSelectList):null
						}
					
                	} catch (e) {
                    console.error(e, 'Error');
                }
            
			
			
			
			/*new Ajax.Request(CUSTOM_URL+'/builder/get_mask_list_for_field', {
           parameters: {     
					
					'field_type':this.objectProperties.field_type
					
                },
            evalJSON: true,            
            method: 'POST',
            onComplete: function (t) {
				
                try {
					var theSelectList = $('fieldMask');
						
					var isSelected= false;
					AddSelectOption(theSelectList, '--', 0, true);	
					
					for(i in t.responseJSON)
						{
							//var myNewOption = new Option(t.responseJSON[i], i,i==15?true:false);							
							
							//theSelectList.selectedIndex = insertNewOption(myNewOption, theSelectList);				

								if( localObjTmp.objectProperties.field_mask &&  i== localObjTmp.objectProperties.field_mask)
								{
									isSelected = true
										
								}
								else
								isSelected = false
									//alert(t.responseJSON[i])
								AddSelectOption(theSelectList, t.responseJSON[i], i, isSelected);
								//alert(this.id)//field_mask
								isSelected?setFieldMask(localObjTmp.id,theSelectList):null
						}
					
                	} catch (e) {
                    console.error(e, 'Error');
                }
            }
        },this);*/
			//return  {"0":"--","1":"1234,55","2":"1.234,55","3":"$12345,55","4":"$1.234,55"};		
		},
	textSizeOptionList:function(){
			return  {"Small":"Small".locale(),"Medium":"Medium".locale(),"Large":"Large".locale()};		
		},
	columnOptionList:function(){
			return  {"1":"One Column","2":"Two Column","3":"Three Column"};
		},	
	sizeOptionList:function(){
		
		return  {"20":"Small".locale(),"30":"Medium".locale(),"40":"Large".locale()};		
	},
	fieldTypeList:function(){
		return  {
				"control_textbox":"Text Field".locale(),
				"control_head":"Header".locale(),
				"control_paragraph":"Paragraph Text".locale(),
				"control_radio":"Radio button".locale(), 
				"control_checkbox":"Checkbox".locale(),
				"control_number":"Number".locale(),
				"control_dropdown":"Dropdown".locale(),
				"control_money":"Money".locale(),
				"money":"Money".locale(), 
				"password":"Password".locale(),
				"control_phonenumber":"Phone".locale(),
				"control_email":"E-mail".locale(),
				"control_datetime":"Date".locale(),
				"control_textarea":"Multiline Text".locale(),
				"control_fileupload":"File upload".locale()
				};
	},
	fieldSize:function(funcName)
	{
		var functionName=''
		if(funcName!='')
			functionName = funcName;
		var html='';
		
		html ='<div class="temp"><select style="width:115px" '+functionName+'><option value="20">Small</option><option value="30">Medium</option><option value="40">Large</option></select></div>';
		return html;		
		
	},
	toolTipInit:function(){
		//new Tip($('newTable'), 'content');

	

		customeToolTip('tipnew')

		/*This was old tooltip*/
		//$$('.tipnew').tooltip();
	},
	
});	/*End ElementsProperty Class*/

function customeToolTip(tipClassName){
	$$('.'+tipClassName).each(function(e){
		//e.setAttribute('style','border :solid 1px red')	
		
		new Tip(e, e.getAttribute('title'), {
	  		
		  className: 'tipbox',
		  
		});
		e.setAttribute('title','')
	})
	
}
function insertNewOption(newOption, selectElement)
{
	
	var optsLen = selectElement.options.length;
	
	selectElement.options[optsLen] = newOption;
	//alert(selectElement)
	return optsLen;
}

function importListFormOpen(type)
{
	var url = CUSTOM_URL+'/buildders/'+type+'/import_defined_list_form'
		
	this.windowTitle = '<h2 class="h2show">'+'Import Alternatives List'.locale()+'</h2>'.locale(),
	this.width = 600,
	this.height = "auto"
	this.contentPadding = 0,
	this.dynamic = false,
	this.wizardWin = null,
	// close button properties
	this.closeButtonTitle = 'Close'.locale(),
	this.closeButtonName = 'close',
	this.HTMLEditor = null,
	this.closeButton = {		
		title:this.closeButtonTitle,
		name:this.closeButtonName,
		handler:function(window){
			
			window.close();
		}
	},
	this.addOptionButton = {		
		title:'Add Alternatives'.locale(),
		name:'AddOptions',
		id:'add_options_id'	,	
		handler:function(window){
			var list = new Array();
			list = $('list_txtarea').value.split("\n")		
			
			if($('list_txtarea').value.strip().length<1)			
			return false
				
			list = jQuery.grep(list,function(n,i){return(n); });
			
			list = list.join("|")
			
			addCheckBox(false,list)
		
			
		}
	},
		
	this.onClose = function (){
        sourceLink = false;
		document._onedit = false;
	},
	this.openWizard = function (div){
	//this.onInsert = shareWizardAccordionManager
    BuildSource.init(getAllProperties());
	    this.wizardWin = document.window({
	       title: windowTitle,
	        width: this.width,
			height:this.height,
	        contentPadding: this.contentPadding,
	        content: div,
	        dynamic: this.dynamic,
	        //onInsert: this.onInsert,
	        onClose: this.onClose,
	        buttons:[ this.closeButton,this.addOptionButton],
			position:''
	    });
	  this.wizardWin.reCenter();
	},
	
	Utils.loadTemplate(url, function(source) {
		var div = new Element("div");			
		div.innerHTML = source;
		this.openWizard(div);								  
	})
//	Utils.alert('Not Implement Yet...'.locale(),'Import List');	
}
function setPublicationDate(selfObj)
{
	var old;
	if(selfObj.id=="start_date")	
	{
		old = $('stage').getProperty('scheduledPublicationStart');		
		updateValue('scheduledPublicationStart', selfObj.value.toString(), '', $('stage'), old);
	}
	else{
		
		old = $('stage').getProperty('scheduledPublicationEnd');
		updateValue('scheduledPublicationEnd', selfObj.value.toString(), '', $('stage'), old);	
	}
}
function setAmPm(selfObj)
{
	var old;
	if(selfObj.id=="start_ampm")	
	{
		old = $('stage').getProperty('scheduledPublicationStartAmPm');		
		updateValue('scheduledPublicationStartAmPm', selfObj.value.toString(), '', $('stage'), old);
	}
	else{
		
		old = $('stage').getProperty('scheduledPublicationEndAmPm');
		updateValue('scheduledPublicationEndAmPm', selfObj.value.toString(), '', $('stage'), old);	
	}
}
function setPublicationTime(selfObj)
{
	var old;
	if(selfObj.id=="start_time")	
	{
		old = $('stage').getProperty('scheduledPublicationStartTime');		
		updateValue('scheduledPublicationStartTime', selfObj.value.toString(), '', $('stage'), old);
	}
	else{
		
		old = $('stage').getProperty('scheduledPublicationEndTime');
		updateValue('scheduledPublicationEndTime', selfObj.value.toString(), '', $('stage'), old);	
	}
}
function setConfirmationEmailId(selfObj){
	var old = $('stage').getProperty('confirmationEmailId');
	updateValue('confirmationEmailId', selfObj.value.toString(), '', $('stage'), old);	
}
function setreplyToEmailId(selfObj){
	
	var old = $('stage').getProperty('replyToEmailId');
	updateValue('replyToEmailId', selfObj.value.toString(), '', $('stage'), old);	
}

function setRadioButtonSelection(id,selfObj)
{
	var checkBoxLabel;
	$$('#id_' + id + ' .form-radio-item label').each(function (rad) {
			var parent = rad.parentNode;
			//rad.setAttribute('style','border:solid 1px green')
			var val = rad.innerHTML.strip();

				if($(rad.id+'_radio').checked)
				{
					checkBoxLabel= val
				}
		});
	var fb_radio_id = selfObj.id.toString().replace("_radio","")
	$(fb_radio_id).checked= true;
	var LiTag	= $('id_'+id);	
	var divEle	= getQuestionSelectedInputWithId(id)
	if(LiTag)
	{
		old = divEle.getProperty('selected');
		
		divEle.setProperty('selected',checkBoxLabel);
		if (checkBoxLabel !== undefined)
		updateValue('selected', checkBoxLabel, LiTag, divEle, old, function () {})
	}
	
}
function setCheckBoxSelection(id,selfObj)
{
	var checkBoxLabel =[];
/*	$$('.chk_lim_prop input[type=checkbox]').each(function(chk){
														   
		if(chk.checked)
			{
				checkBoxLabel.push(chk.value);
				
			}
	})
	*/
	$$('#id_' + id + ' .form-checkbox-item label').each(function (rad) {
			var parent = rad.parentNode;
			//rad.setAttribute('style','border:solid 1px green')
			var val = rad.innerHTML.strip();
			
				if($(rad.id+'_checkbox').checked)
				{
					
					checkBoxLabel.push(val);
				}
				
			
		});
	
	
	checkBoxLabel = checkBoxLabel.join('|')
	
	//alert(checkBoxLabel)
	var LiTag	= $('id_'+id)
	
	var divEle	= getQuestionSelectedInputWithId(id)
	//alert(divEle.getProperty('selected'))
	if(LiTag)
	{
		but = false;
		var values = [];

		var ne = $$('li.question-selected div.question-input').first()
		var old = ne.getProperty('selected');


		updateValue('selected', checkBoxLabel, LiTag, divEle, old, function () {
				// Any code
            })
	
	}
}
function setDropdownSelection(id,selfObj){
	
	
	
	
	
	
	//alert(checkBoxLabel)
	var LiTag	= getQuestionSelectedLi()
	var input_add;
	var divEle	= getQuestionSelectedInputWithId(id)
	if(LiTag)
	{
		
		$$('.chk_lim_prop input[type=radio]').each(function(radio){
														//	alert(radio.checked)
			if(radio.checked)
			{
				input_add = radio.id.toString().replace("dropdown","input_add")
				
				
			}																   
		})
		var old = divEle.getProperty('selected');
//alert(old)
		if(input_add!==undefined)
		updateValue('selected', $(input_add).value, LiTag, divEle, old, function () {
				// Any code
            })
	
	}

}
function setDropdownLabel(id,selfObj)
{
	var checkBoxLabel =[];
/*	$$('.chk_lim_prop input[type=checkbox]').each(function(chk){
														   
		if(chk.checked)
			{
				checkBoxLabel.push(chk.value);
				
			}
	})
	*/
	$$('.add_text').each(function(ele){
								  
		checkBoxLabel.push(ele.value.toString())
	})
	
	
	
	
	checkBoxLabel = checkBoxLabel.join('|')
	
	//alert(checkBoxLabel)
	var LiTag	= $('id_'+id)
	
	var divEle	= getQuestionSelectedInputWithId(id)
	if(LiTag)
	{
		but = false;
		var values = [];

		var old = divEle.getProperty('options');
//alert(old)

		updateValue('options', checkBoxLabel, LiTag, divEle, old, function () {
				// Any code
				setDropdownSelection(id,selfObj)
            })
	
	}
}
function setRadioButtonLabel(id,selfObj)
{
	
	var LiTag	= $('id_'+id);	
	var divEle	= getQuestionSelectedInputWithId(id)

	if(LiTag)
	{
		
		var val = selfObj.value		
		but = false;
		var values = [];
		$$('#id_' + id + ' .form-radio-item label').each(function (rad) {
			var parent = rad.parentNode;
			
			var val = rad.innerHTML.strip();
				if(rad.id+'_input_add'==selfObj.id)
				{
	
					val = selfObj.value;
				}
				
			if (val) {
				values.push(val);
			}
		});

		
		//divEle.setAttribute('style','border:solid 1px green')
		
		old = divEle.getProperty('options');

		updateValue('options', values.join('|'), LiTag, divEle, old, function () {
			
					setRadioButtonSelection(id,selfObj);

            })
		//alert(divEle.getProperty('selected'))
		
	}
}
function setCheckBoxLabel(id,selfObj)
{

	var LiTag	= $('id_'+id);	
	var divEle	= getQuestionSelectedInputWithId(id)

	if(LiTag)
	{
		
		var val = selfObj.value		
		but = false;
		var values = [];

//		#id_1 .form-checkbox-item label
		$$('#id_' + id + ' .form-checkbox-item label').each(function (rad) {
			var parent = rad.parentNode;
			
			var val = rad.innerHTML.strip();
				if(rad.id+'_input_add'==selfObj.id)
				{
	
					val = selfObj.value;
				}
				
			if (val) {
				values.push(val);
			}
		});

		//ne.setProperty('options', values.join('|'));
		old = divEle.getProperty('options');

		if (val.length)
		updateValue('options', values.join('|'), $(LiTag.id), divEle, old, function () {
				setCheckBoxSelection(id,selfObj)               
            })
		

	}
}
function addCheckBox(id,list)
{

	var LiTag= getQuestionSelectedLi();
	var divEle = getQuestionSelectedInput()
//	LiTag.setAttribute('style','border:solid 1px red')
	var id = LiTag.id.replace('id_','')

	var ops = divEle.getProperty('options').split('|');

	var old = ops.join('|');	 
	if(list === undefined)
	{
		ops.push('Option'.locale() + (ops.length + 1));
	    var val = ops.join('|');
		var res = updateValue('options', val, $(LiTag.id), divEle, old, function () {  });
	}
	else
	{
		var res = updateValue('options', old + "|"+list, $(LiTag.id), divEle, old, function () {  });
	}
	objGetProperties =new GetElementProperties(id);
	var obj = new ElementProperties(id);
	obj.objectProperties = objGetProperties.getProperties();

	if(obj.getToolBar())
		obj.toolTipInit();


//$(selfObj.id).parentNode.parentNode.setAttribute('style','border:solid 1px red')
	//$('chk_lim_prop').insert(t)
	}

function isElementOptionRemoveable(id)
{
	
	var willElementDelete = true;
	//if(!isChildForm)
	/*Added by Manish 16-july 2011 becuase user can remove the options of  checkbox,drop down and radio type element*/
		return 	willElementDelete;
		
		var firstElement = Form.getElements($('id_'+id)).find(function(element) {
		return element.type != 'hidden' && !element.disabled &&
		['input','button','select'].include(element.tagName.toLowerCase());
	});
		
	var qname =firstElement.name.replace('[]','');
	//alert(qname)
		if(EDIT_MODE)
		{
			
			for(i in edit_prop)
			{
				
				if(edit_prop[i]==qname)	
				{
					
					willElementDelete = false
				}
			}
			
		}
	return 	willElementDelete
	
}
function getQuestionSelectedLi()
{
	return $$('li.question-selected').first();

}
function getQuestionSelectedInput()
{
	return $$('li.question-selected div.question-input').first();

}
function getQuestionSelectedInputWithId(id)
{
	return $$('#id_'+id+' div.question-input').first();

}
function getEmailEelementNameInput(id)
{
	return $$('#id_'+id+' div.question-input input[type=email]').first();

}
function getSelectedInputFieldName(id)
{

	var firstElement = Form.getElements($(id)).find(function(element) {											
		return element.type != 'hidden' && !element.disabled &&
		['input','button','select','textarea'].include(element.tagName.toLowerCase());
	});
	//firstElement.getAttribute('name');
	return firstElement.getAttribute('name').toString().replace('[]','')
}
function findByNameElement(eleName){
	var flag = false
	//alert(eleName + "="+flag.toString())	
	if(eleName.length<1)
		return true ;
	
	var firstElement = Form.getElements($('list')).find(function(element) {											
				//alert(element.name)												 
		if (element.type != 'hidden' && !element.disabled &&['input','button','select','textarea'].include(element.tagName.toLowerCase()))
			{
				var oldEleName = element.name.toString().replace("[]","")
				
				if(oldEleName == eleName)
					flag = true	
			}
	});
	
	return flag;
}
function removeDropdownItem(id,selfObj)
{
	if($$('.chk_lim_prop input[type=text]').length<2)
	return;
	if(!isElementOptionRemoveable(id))
	{
		Utils.alert("You can not delete this element.".locale(),'Error')	
		return ;	
		
	}
	
	var values = new Array()
	var LiTag= getQuestionSelectedLi();
	var divEle = getQuestionSelectedInput()
	
	$$('.add_text').each(function(ele){
		//ele.setAttribute('style','border:solid 1px red');							  
		var chkboxId = ele.id.toString().replace("input_add","chk_rem")
		//var inputObj =  $(rowId+'input_add')

		if(selfObj.id != chkboxId)
		{
			values.push(ele.value)
		}
		else{
			//ele.parentNode.remove();
			
		}
		//alert(rowId)
	})
	var old = divEle.getProperty('options')
	//alert( values.join('|'))
	var res = updateValue('options', values.join('|'), LiTag, divEle, old, function () {
			objGetProperties =new GetElementProperties(id);
			var obj = new ElementProperties(id);
			obj.objectProperties = objGetProperties.getProperties();
		
			if(obj.getToolBar())
				obj.toolTipInit();
		})
	
	//alert(values)
}
function removeChecckBox(id,selfObj,optionSubId,type)
{
	/*Find the name of element */
	/*var willElementDelete = true;
		var firstElement = Form.getElements($('id_'+id)).find(function(element) {
		return element.type != 'hidden' && !element.disabled &&
		['input','button'].include(element.tagName.toLowerCase());
	});
	var qname =firstElement.name.replace('[]','');
	
		if(EDIT_MODE)
		{
			
			for(i in edit_prop)
			{
				
				if(edit_prop[i]==qname)	
				{
					willElementDelete = false
				}
			}
			
		}
*/
	 

	if($$('.chk_lim_prop input[type=text]').length<2)
	return;
	if(!isElementOptionRemoveable(id))
	{
		/*
		
		if($('label_input_'+id+'_'+optionSubId+'_input_add'))
		{
				alert(ops.indexOf($('label_input_'+id+'_'+optionSubId+'_input_add').value))
		}*/
		Utils.alert("You can not delete this element.".locale(),'Error')	
		return ;	
		
	}
	var LiTag= getQuestionSelectedLi();
	var divEle = getQuestionSelectedInput()
	//divEle.setAttribute('style','border:solid 1px red');
	
	var optionId = selfObj.id.toString().replace('_chk_rem',"")


	var ops = divEle.getProperty('options').split('|');
	var old = ops.join('|');
	
	
	if($(optionId))
	{
		$(optionId).parentNode.remove();
		
		ops = divEle.getProperty('options').split('|');
		var values = [];
	

			$$('#id_' + id + ' .form-'+type+'-item label').each(function (rad) {
																		  
				var parent = rad.parentNode;			
				var val = rad.innerHTML.strip();
				
					
				if (val) {
					values.push(val);
				}
			});
		
		var val = values.join('|');
		
		var res = updateValue('options', val, $(LiTag.id), divEle, old, function () {
				//openOptionEdit(id, ops.length);
		})
	}
	objGetProperties =new GetElementProperties(id);
	var obj = new ElementProperties(id);
	obj.objectProperties = objGetProperties.getProperties();

	if(obj.getToolBar())
		obj.toolTipInit();

}
function setFieldMask(inputId,selfObj)
{
	
		var LiTag = getQuestionSelectedLi();
		var divEle = getQuestionSelectedInput()
		
		if(divEle)
		{
			//alert(selfObj.value)
			if (divEle.getProperty('type') =="control_datetime")
			{
				
				divEle.setProperty('oldFormat',divEle.getProperty('format'))
				//alert(selfObj.value+''+selfObj.options[selfObj.selectedIndex].textContent)
				var mask ='MM/DD/YYYY'
				if (selfObj.selectedIndex)
					mask = selfObj.options[selfObj.selectedIndex].textContent
				divEle.setProperty('format',mask)
			}
			
			if (divEle.getProperty('type') =="control_money")
				updateValue('currencyFormat', selfObj.value,LiTag, divEle, '');
			else
				updateValue('fieldMask', selfObj.value,LiTag, divEle, '');
				
			
		
		}
		
	
}

function isDuplicate (inputId,obj){
	
	var id = 'id_'+inputId;	
	var divEle = getQuestionSelectedInput()
	//alert(divEle.getProperty('dulicate'))
	if(divEle != 'undefined')
	{
		updateValue('dulicate', obj.checked?'Yes':'No',$(id), divEle, '');
		
	
	}
}
function isUserLogged(inputId,obj){
	
	//alert(obj.checked + ':Is loggged')
	
	var id = 'id_'+inputId;	
	var divEle = getQuestionSelectedInput()

	if(divEle != 'undefined')
	{
		updateValue('islogged', obj.checked?'Yes':'No',$(id), divEle, '');
	
	}
	else {
		
		divEle = getQuestionSelectedInputWithId(inputId)
		updateValue('islogged', obj.checked?'Yes':'No',$(id), divEle, '');
	}
}
function isSetDefaultValue(inputId,obj)
{
	var id = 'id_'+inputId;	
	var divEle = getQuestionSelectedInput()
	
	if(divEle == undefined)
	{
			
		divEle = getQuestionSelectedInputWithId(inputId)
	
	}
		
	updateValue('defaultTime', obj.checked?'Yes':'No',$(id), divEle, '');
	
	if(obj.checked)
		{
			$('defaultDateInput').value = divEle.getProperty('defaultValue')
			updateValue('defaultValue', divEle.getProperty('defaultValueBackup'),$(id), divEle, '');
			
		}
	else
		{
			
			$('defaultDateInput').value = ''
			updateValue('defaultValue', '',$(id), divEle, '');
		}
}
function setDateRange(inputId,obj)
{
	var id = 'id_'+inputId;	
	var divEle = getQuestionSelectedInput()
	if("set_from"==obj.id)
	{
		range ='startRange'
		
	}
	else if("set_to"==obj.id)
	{
		range ='endRange'
		
	}
	
	if(divEle != 'undefined')
	{
		updateValue(range, obj.value,$(id), divEle, '');
	
	}
	else {
		
		divEle = getQuestionSelectedInputWithId(inputId)
		updateValue(range, obj.value,$(id), divEle, '');
	}
	//alert(divEle.getProperty(range))
}

function makeSelectionLimit(inputId,obj)
{
	var id = 'id_'+inputId;	
	var divEle = getQuestionSelectedInput()
	
	if (!obj.checked)
	{
		$('chk_opt_lim').setAttribute('style','display:none')
		$('chk_opt_alt').setAttribute('style','width:100%')
	}else
	{
		$('chk_opt_lim').setAttribute('style','display:block')
		$('chk_opt_alt').setAttribute('style','width:70%')
		}
	updateValue('limit', obj.checked,$(id), divEle, '');
		
}
function makeFieldRequire(inputId,obj)
{
	var id = 'id_'+inputId;	
	var divEle = getQuestionSelectedInput()

	if(divEle != 'undefined')
	{
		updateValue('required', obj.checked?'Yes':'No',$(id), divEle, '');
	
	}

}
function changeLabel(eleId,obj)
{ 
	 
	var LiTag	= $('id_'+eleId)	
	var divEle	= getQuestionSelectedInputWithId(eleId);
	
	
	var id = 'id_'+eleId;	
	var val = obj.value.strip();
	//var divEle = getQuestionSelectedInput()


	
	
		//if($$('li.question-selected input[type=text]').first() != 'undefined')
		if(divEle)
		{
		//	$$('li.question-selected input[type=text]').first().setAttribute('size',selfObj.value);
		
			//var id = $$('li.question-selected').first().id;
			//var divEle = $$('li.question-selected div.question-input').first();
		
			if(divEle != 'undefined')
			{
				
				divEle.setProperty('name', makeQuestionName(val.strip(), id));
				updateValue('text', val,$(id), divEle, '',function(){																
					addEmailToSendConfirmation()												
				});

			}
		}
		
	//	$(eleId).innerHTML=obj.value;
}
function valueAlignment(inputId,selfObj){
		
			var id = getQuestionSelectedLi().id;
			var divEle = getQuestionSelectedInput()
			divEle.setAttribute('style','border:solid 1px red')
			if(divEle)
			{
				updateValue('numberTextAligned', selfObj.checked?'Yes':'No',$(id), divEle, '');				
			}
}

Object.extend(Array.prototype, {
 	
    /**
     * Tooltip
     * Prototype version: >= 1.5
     * 
     * Example:
     * 
     * // tip
     * <span class="tip" title="ToolTip"></span>
     * 
     * // processing
     * $$('.tip').tooltip();
     * 
     * PS. Styles for the .tip should be defined
     * 
     */   
    tooltip: function(param){
    	
    	// html
    	var html    = $$('html')[0];
    	// body
    	var body    = document.body;
    	// box
    	var tbox    = null;
    	// cash
    	var cash    = {tbox:[]};
    	// screen width
    	var sw      = html.clientWidth;
    	// screen height
    	var sh      = html.clientHeight;
    	// offsetX (only body position with margin:0 auto)
    	var offsetX = Math.round((sw - body.clientWidth) / 2);
    	// offsetY (only body position with margin:0 auto)
    	var offsetY = Math.round((sh - body.clientHeight) / 2);
    	// element where the event occurred
    	var e = null;
       
    	// create tooltip box
    	function createbox(evt){ 
   	    		
    		// element where the event occurred
    		e  = evt.target ? evt.target : evt.srcElement;
    		// id for tooltip box in the cache
     	    var id = e.id.indexOf('_') >=0 ? e.id.substr(e.id.indexOf('_') + 1, e.id.length) : cash.tbox.length + 1;
     	 
     	        if(typeof(cash.tbox[id]) != 'undefined') {     	    	
     	    	     tbox = cash.tbox[id];     	    	   	    	
     	        }
     	        else{    
     	    	   // create tooltip box
     	    	   tbox = document.createElement('div');
     	    	  // set class
     	    	  $(tbox).addClassName('tipbox');
     	    	  //
     	    	  $(tbox).addClassName(!param ? 'standart' : param);
				  
     	    	  // set attributes
     	    	  tbox.setAttribute('id', 'tipbox_' + id);
     	    	  // set id (if non exist)
     	    	  if(!e.id) e.setAttribute('id', 'ptipbox_'+ id);
     	    	  // fill tooltip
     	    	  $(tbox).update('<p>' + e.title + '</p>');
     	    	  // hide title
     	    	  e.setAttribute('title', '');
     	    	  // add tooltop to chache
     	    	  cash.tbox[id] = tbox;
     	           	   
     	    	  // add mousemove event handler
     	    	  $(tbox).observe('mousemove', posbox.bind(this));     	
    			
     	       }
     	    
     	       //add tooltip to body
     	       body.appendChild(tbox);
   
     	       posbox(evt);	    	
    
    	}
    	
    	// position tooltip
    	function posbox(evt){

                if(tbox == null) return;
    	    		
    		// element where the event occurred
    		e  = evt.target ? evt.target : evt.srcElement;
    		
    		// tooltip position
     	   	var x  = y = '';
       		// mouse coordinates	
     	   	var gY = (evt.pageY) ? evt.pageY : evt.clientY + (document.documentElement.scrollTop  || body.scrollTop)  - document.documentElement.clientTop;
     	        var gX = (evt.pageX) ? evt.pageX : evt.clientX + (document.documentElement.scrollLeft || body.scrollLeft) - document.documentElement.clientLeft;
     	   
     	        var realX = gX - offsetX + 1; // kill flicker in firefox (+1)
     	        var realY = gY - offsetY + 1;
     	    
     	       // left || right
     	       if( realX + parseInt($(tbox).getWidth()) > body.clientWidth )
     	    	  $(tbox).setStyle({right:(body.clientWidth - realX) + 'px'});
     	       else
     	    	  $(tbox).setStyle({left:realX + 'px'});
     	         	         	    
				$(tbox).setStyle({position:'absolute'})
				//$(tbox).setStyle({width:'100%'})
				
    		  $(tbox).setStyle({top:  gY + 'px'});
		     	    		
    	}	
    	
    	// deleting toolbox
    	function delbox(evt){
    	    		    		    		
    		// element where the event occurred
    		e = evt.target ? evt.target : evt.srcElement;
    		// get id from element where event occurred
    		var id = e.id.indexOf('_') >=0  ? e.id.substr(e.id.indexOf('_') + 1, e.id.length) : '';
    		
    		if (!id || $('tipbox_' + id) == null) return;
    	      		
    		// remove tooltip from DOM
    		body.removeChild($('tipbox_' + id));   
        		
    	}
    	
    	this.each(function(item){
    	    item.observe('mouseover', createbox.bind(this));
    		item.observe('mousemove', posbox.bind(this));
    		item.observe('mouseout',  delbox.bind(this));
    		
    	})    	
     }
 });
/*Added by neelesh custome function*/
function setDecimalPlace(inputId,selfObj)
{
	var val = selfObj.value.strip();
	if($$('li.question-selected input[type=text]').first() != 'undefined')
		{
		
			var id = getQuestionSelectedLi().id;
			var divEle = getQuestionSelectedInput()
		
			if(divEle)
			{
				
				updateValue('decimalPosition', val,$(id), divEle, '');
			}
		}
	
}
function setNumberRange(inputId,selfObj)
{
	var range ='' ;
	var val = selfObj.value.strip();
	if("set_from"==selfObj.id)
	{
		range ='startRange'
		
	}
	else if("set_to"==selfObj.id)
	{
		range ='endRange'
		
	}else{
		
		return false;
	}
	var LiTag	= getQuestionSelectedLi()	
	var divEle	= $$('#id_'+inputId+' div.question-input').first();
	
		
	if(LiTag)
		{
		
			
			//var divEle = $$('li.question-selected div.question-input').first();
		
			if(divEle)
			{
				//alert(val)
				updateValue(range, val,LiTag, divEle, '');
				//alert(divEle.getProperty(range) + "==" + range)
			}
		}
	
}
/*Set From Properties*/
function setFormName(obj)
{
	var val = obj.value;
	var old = $('stage').getProperty('title');	
	updateValue('title', val, '', $('stage'), old);
	$('form-heading').setText(val)
	
	
}
function setFormAllignment(obj)
{
	var val = obj.value;
	var old = $('stage').getProperty('alignment');
	updateValue('alignment', val, '', $('stage'), old);
}
function setFormLanguage(obj)
{
	var val = obj.value;
	var old = $('stage').getProperty('language');
	updateValue('language', val, '', $('stage'), old);
}
function setMaxEntries(selfObj)
{
	if(isNaN(selfObj.value))selfObj.value='';	
	var old =$('stage').getProperty('maxEntries');	
	updateValue('maxEntries', selfObj.value, '', $('stage'), old);
}
function setCaptcha(selfObj)
{
	if(isNaN(selfObj.value))selfObj.value='';	
	var old =$('stage').getProperty('captcha');	
	updateValue('captcha', selfObj.value, '', $('stage'), old);
	
	
}
function setMaxLength(inputId,selfObj)
{
	
	var val = parseInt(selfObj.value);
	
	var LiTag	= $('id_'+inputId)	
	var divEle	= $$('#id_'+inputId+' div.question-input').first();
	
		if(LiTag)
		{
		//	$$('li.question-selected input[type=text]').first().setAttribute('size',selfObj.value);
		
			var id = LiTag.id;
			
		
			if(divEle)
			{
				updateValue('maxsize', val,$(id), divEle, '');
			}
		}
		
	//Another way to do this : $('input_'+inputId).maxLength =selfObj.value;
	

}
function setFieldSize(inputId,selfObj,fieldType)
{

	if (fieldType == "control_textarea")
	{
		if($$('li.question-selected textarea').first() != 'undefined')
		{
		//	$$('li.question-selected input[type=text]').first().setAttribute('size',selfObj.value);
		
			var id = getQuestionSelectedLi().id;
			var divEle = getQuestionSelectedInput()
		
			if(divEle != 'undefined')
			{
				//divEle.setAttribute('style','border:solid 1px green')

				updateValue('size', selfObj.value,$(id), divEle, '');
	
			}
		}
	}
	else
	if($$('li.question-selected input[type=text]').first() != 'undefined')
		{
		//	$$('li.question-selected input[type=text]').first().setAttribute('size',selfObj.value);
		
			var id = getQuestionSelectedLi().id;
			var divEle = getQuestionSelectedInput()
		
			if(divEle != 'undefined')
			{
				//alert($(id).setAttribute('style','border:solid 1px green'))
				updateValue('size', selfObj.value,$(id), divEle, '');
	
			}
		}
		
		
}
function setSpreadCols(eleId,obj)
{
	var LiTag	= $('id_'+eleId)
	//alert(obj.value)
	var divEle	= $$('#id_'+eleId+' div.question-input').first();
	if(divEle)
		updateValue('spreadCols', obj.value,$(LiTag.id), divEle, '');
	
}
function setFontSize(eleId,obj)
{
	//alert(selfObj.value);
	//return
	var id = 'id_'+eleId;	
	var val = obj.value.strip();
	var divEle = getQuestionSelectedInput()

	

	//alert(eleId)
	
		if($$('li.question-selected input[type=text]').first() != 'undefined')
		{
		//	$$('li.question-selected input[type=text]').first().setAttribute('size',selfObj.value);
		
			var id = getQuestionSelectedLi().id;
			var divEle = getQuestionSelectedInput()
		
			if(divEle)
			{
				
				//divEle.setProperty('name', makeQuestionName(val.strip(), id));
				updateValue('headerType', val,$(id), divEle, '');
				
				//$(id).setAttribute('style','background:gray')
				//var liTag = 'id_'+inputId
				//$(liTag).addClassName('question-selected');
				//updateValue('alignment', val, '', $('stage'), old);
			}
		}
		
		
}
function showTextMessage(obj)
{
	var val = obj.value;
	var old = '';//prop.value.value;	

	updateValue('activeRedirect', 'thanktext', '', $('stage'), old);
	updateValue('thanktext', obj.value, '', $('stage'), old);
	/*if($('submit_message_id').checked)	
	{
	//alert(obj.value)
		updateValue('thanktext', obj.value, '', $('stage'), old);
	}
	else
	{
		updateValue('thanktext', '', '', $('stage'), old);
		
		if(!$('show_url_id').checked)	
			updateValue('thankurl', '', '', $('stage'), old);
	}
	alert($('stage').getProperty('activeRedirect'))	*/
}
function showUrlMessage(obj)
{
	var old ='';
	
	
	updateValue('activeRedirect', 'thankurl', '', $('stage'), old);
	updateValue('thanktext', obj.value, '', $('stage'), old);
	//alert("==="+$('stage').getProperty('activeRedirect'))
	/*
	if($('show_url_id').checked)	
		updateValue('thankurl', obj.value, '', $('stage'), old);
	else
	{
		if(!$('submit_message_id').checked)	
			updateValue('thanktext', '', '', $('stage'), old);
			
		//$('send_confirmation_mail').setValue('');
		updateValue('thankurl', '', '', $('stage'), old);
	}*/	
}
function sendTextMessage(obj)
{
	
	if(!$('email_textarea_id').checked)	
		return;
	updateValue('emailMsgType', 'text', '', $('stage'), '');	
	var old =$('stage').getProperty('emailText');
	updateValue('emailText', obj.value, '', $('stage'), old);
	
	
	/*if($('email_textarea_id').checked)	
		updateValue('send_message', obj.value, '', $('stage'), old);
	else
	{
		if(!$('email_url_id').checked)	
			updateValue('send_url', '', '', $('stage'), old);
			
		//$('send_confirmation_mail').setValue('');
		updateValue('send_message', '', '', $('stage'), old);
	}	*/
}
function sendUrlMessage(obj)
{
	if(!$('email_url_id').checked)
		return ;
	updateValue('emailMsgType', 'url', '', $('stage'), '');
	var old =$('stage').getProperty('emailText');;	
	updateValue('emailText', obj.value, '', $('stage'), old);

	
	/*if($('email_url_id').checked)	
		updateValue('send_url', obj.value, '', $('stage'), old);
	else
	{
		if(!$('email_textarea_id').checked)	
			updateValue('send_message', '', '', $('stage'), old);
			
		//$('send_confirmation_mail').setValue('');
		updateValue('send_url', '', '', $('stage'), old);
	}	*/
	
	}
function setDefaultVaue(inputId,selfObj){
	
	var LiTag	= $('id_'+inputId)	
	var divEle	= $$('#id_'+inputId+' div.question-input').first();
	
	
	if(LiTag)
		{
		//$$('li.question-selected input[type=text]').first().setAttribute('size',selfObj.value);		
			//var id = $$('li.question-selected').first().id;
			//var divEle = $$('li.question-selected div.question-input').first();
			
			if(divEle)
			{
				updateValue('defaultValue', selfObj.value,$(LiTag.id), divEle, '');

			}
		}
}
function setSubHeading(inputId,selfObj)
{
	//sub_heading
	/*if($$('li.question-selected').first())
	{
		//alert(selfObj.value)
		var id = $$('li.question-selected').first().id;
		var divEle = $$('li.question-selected div.question-input').first();
		//divEle.setProperty("subHeader", selfObj.value);
		updateValue('subHeader', selfObj.value,$(id), divEle, '');
	}*/

	
	if($('id_'+inputId))
	{
		var id = 'id_'+inputId;
		var divEle = $$('#id_'+inputId+' div.question-input').first();
	
		if(divEle)
		{	
		
			updateValue('subHeader', selfObj.value.replace(/\n+/g, '<br/>'),$(id), divEle, '');
			
		}
	}
	
	
	
}
function setHintDescription(inputId,selfObj) 
{
	//#id_1
	
	if($('id_'+inputId))
	{
		
		var id = 'id_'+inputId;
		var divEle = $$('#id_'+inputId+' div.question-input').first();

		if(divEle)
		{
			updateValue('description', selfObj.value,$(id), divEle, '');
			//$('id_'+inputId).setAttribute('style','border:solid 1px red');
		}
	}
	
}
function makeDuplicate(){

	var ne = getQuestionSelectedInput()

	
	if(ne.getProperty('type')=="control_button")
	{
		Utils.alert("You can not make duplicate for submit button!!","Error");
		return;
	}

	
	var ne = getQuestionSelectedInput()

	if(ne)
	{
		
		var container = getQuestionSelectedLi();

		var dprop = Utils.deepClone(ne.retrieve('properties'));
		//alert(dprop.text)value
		var elem = new Element('li', {
			type: container.type
		});
		dprop.qid.value = getMaxID() + 1;
		dprop.name.value = dprop.name.value.replace(/\d+/, '') + dprop.qid.value;
		container.insert({
			after: elem
		});
		createDivLine(elem, dprop);
		createList();
            	
	}
}
function removeElement(){
	var ne = getQuestionSelectedInput()

	if(ne)
	{		
		var container = getQuestionSelectedLi();
		removeQuestion(container, ne);		            	
	}
              	
}

var GetElementProperties = Class.create();
GetElementProperties.prototype = {
  initialize: function(id) {
	  
	this.id=id.toString();
	this.liId = 'id_'+this.id;
	this.labelId= 'label_'+this.id;
	this.inputId = 'input_'+this.id;
    this.elementType = this.getElementType();
	//this.getProperties();
	
  },
  getProperties:function(){
	  var flag = false;
	
	  switch(this.elementType)
	  {
		case 'control_email':
		case 'control_phonenumber':				
		case 'control_textbox':
				this.getSingleLineTextBoxProp();
				flag = true;
			break;
			
			case 'control_button':
				flag = false;
			break;
			
			case 'control_checkbox':
				this.getCheckBoxProp();
				flag = true;
			break;
			
			case 'control_number':
				this.getNumberBoxProp();
				flag = true;
			break;
			case 'control_fileupload':
			case 'control_paragraph':
			case 'control_head':
				this.headingBoxProp();
				flag = true;
			break;
			case 'control_radio':
				this.getRadioButtonProp();
				flag = true;
			break;
			
			case 'control_dropdown':
				this.getDropdownProp();
				flag = true;
			break;
			case 'control_money':
				this.getNumberBoxProp();
				flag = true;
			break;
			case 'control_datetime':
				this.dateBoxProp();
				flag = true;
			break;
			case 'control_textarea':
				this.getTextAreaProp();
				flag = true;
			break;
			
			default:
				flag = false;
				//this.singleLineTextBox();
				
			break;
			
		}
		if(flag)
			return this.objectProperties;
			
	
  },
  	dateBoxProp:function(){
		var divEle = getQuestionSelectedInputWithId(this.id)
		var prop = (divEle.retrieve('properties'))
		var allow_duplicate	=prop.dulicate?( prop.dulicate.value=='Yes'?true:false):false;
		var loged_user	= prop.islogged?(prop.islogged.value=='Yes'?true:false):false;

		var endRange;
		var startRange;
		
		this.objectProperties = {
				"field_label":prop.text.value,
				"field_type":this.elementType,
				//"field_size":prop.size?prop.size.value:undefined,
				"max_length":prop.defaultValue?prop.maxsize.value:undefined,
				"default_value":prop.defaultValue?prop.defaultValue.value:new Date(),
				"default_date":(prop.defaultTime && prop.defaultTime.value=="Yes")?true:false,
				"required":prop.required?(prop.required.value=='Yes'?true:false):false,
				"allow_duplicate":allow_duplicate,
				"loged_user":loged_user,
				"hint_desc" :prop.description.value,
				"association":prop.association?prop.association.value:0,
				"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
				"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value,
				"field_mask": prop.fieldMask !== undefined ? prop.fieldMask.value : undefined,
				"from":prop.startRange?prop.startRange.value:'',
				"to":prop.endRange?prop.endRange.value:'' 
				
			};	
						
	  //alert(new Date(startRange).toString())
	},
  headingBoxProp:function(){

	var field_size 	= '';

	var label	=	'Label';
	var font_size = 'Medium'
	var sub_heading = ''
	var divEle = $$('#id_' + this.id + ' div.question-input').first();
	if(divEle!='undefined')
		{
			
			var prop = (divEle.retrieve('properties'));	
			//alert(prop.subHeader.value)
			label			= prop.text.value!=''?prop.text.value:label	
			font_size		= prop.text.size!=''?prop.text.size:font_size
			sub_heading		= prop.subHeader.value!=''?prop.subHeader.value:sub_heading
			font_size		= prop.headerType ? prop.headerType.value:font_size
		}
		
			this.objectProperties = {"field_label":label,
									"field_type":this.elementType,
									"font_size":font_size,
									"sub_heading":sub_heading,
									"association":prop.association.value,
									"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
									"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value};	
									
	 },
  getNumberBoxProp:function(){
	  	
	
		var field_size 	= '';
		var max_length 	= '';
		var default_value ='';
		var required 	= false;
		var hint_desc	= '';
		var allow_duplicate	= false;
		var loged_user	= false;
		var label	=	'Label';
		var to		=	'';
		var from	=	'';
		var number_text_aligned	='No';
		var field_mask ;;
		var decimal_pos =''
		//var currencyFormat = null		


	var divEle = $$('#id_' + this.id + ' div.question-input').first();
	if(divEle!='undefined')
		{
			
			var prop = (divEle.retrieve('properties'))
			//alert(prop.defaultValue)
			
			field_size 		= prop.size.value;
			max_length 		= prop.maxsize.value;
			default_value 	= prop.defaultValue.value;
			required 		= prop.required.value=='Yes'?true:false;
			hint_desc		= prop.description.value;			
			loged_user 		= prop.islogged.value=='Yes'?true:false;
			allow_duplicate	= prop.dulicate.value=='Yes'?true:false;				
			label			= prop.text.value!=''?prop.text.value:label

			from			= prop.startRange.value!=''?prop.startRange.value:from
			to				= prop.endRange.value!=''?prop.endRange.value:to;
			
			field_mask		= prop.fieldMask !== undefined ? prop.fieldMask.value :field_mask
			
			decimal_pos		= prop.decimalPosition !== undefined  ?	prop.decimalPosition.value:''
			
			number_text_aligned	= prop.numberTextAligned.value=='No'?false:true
			
			//alert(field_mask)
			//alert(currency)
		}
		//alert(prop.numberTextAligned.value)
			this.objectProperties = {"field_label":label,
								"field_type":this.elementType,
								"field_size":field_size,								
								"default_value":default_value,
								"required":required,
								"allow_duplicate":allow_duplicate,
								"loged_user":loged_user,
								"hint_desc" :hint_desc,
								"number_text_aligned":number_text_aligned,
								"to":to,
								"from":from,
								"field_mask":field_mask,
								"decimalPosition":decimal_pos,
								"max_length":max_length,
								"association":prop.association.value,
								"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
								"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value,
								"currency_format":prop.currencyFormat !== undefined  ?	prop.currencyFormat.value:''
								};	

  
	 },
  getTextAreaProp:function(){
	var max_length 	= '';
	var field_size 	= '';	
	var default_value ='';
	var required 	= false;
	var hint_desc	= '';
	var allow_duplicate	= false;
	var loged_user	= false;
	var label	=	'';

	var divEle = getQuestionSelectedInputWithId(this.id )

	
	if(divEle!='undefined')
		{
			
			var prop = (divEle.retrieve('properties'))

			max_length 		= prop.maxsize? prop.maxsize.value : undefined;
			field_size 		= prop.size ? prop.size.value : undefined;			
			default_value 	= prop.defaultValue.value;
			required 		= prop.required.value=='Yes'?true:false;
			hint_desc		= prop.description.value;			
			loged_user 		= prop.islogged.value=='Yes'?true:false;
			allow_duplicate	= prop.dulicate.value=='Yes'?true:false;			
			label			= prop.text.value!=''?prop.text.value:label
			
			
		}
		//alert(prop.validation.value)
		//alert(prop.dbfieldName.value)
	this.objectProperties = {"field_label":label,
								"max_length":max_length,
								"field_type":this.elementType,
								"field_size":field_size,
								"default_value":default_value,
								"required":required,
								"allow_duplicate":allow_duplicate,
								"loged_user":loged_user,
								"hint_desc" :hint_desc,
								"association":prop.association.value,
								"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
								"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value,
								"field_mask": prop.fieldMask !== undefined ? prop.fieldMask.value : undefined
								};	
								
	  
	},
  getSingleLineTextBoxProp:function(){
	
		var field_size 	= '';
		var max_length 	= '';
		var default_value ='';
		var required 	= false;
		var hint_desc	= '';
		var allow_duplicate	= false;
		var loged_user	= false;
		var label	=	'';
		//$$('li.question-selected').first().id
		
		if(getQuestionSelectedLi()!='undefined')
		{
		
		}
	//getQuestionSelectedInputWithId(this.id ).setAttribute('style','border:solid 1px green');

//	var divEle = $$('#id_' + this.id + ' div.question-input').first();
	var divEle = getQuestionSelectedInputWithId(this.id )
	//divEle.setAttribute('style','border:solid 1px red');
	
	if(divEle!='undefined')
		{
			
			var prop = (divEle.retrieve('properties'))
			
		/*	field_size 		= $(this.inputId).getAttribute('size')!=null?$(this.inputId).getAttribute('size'):'';
			max_length 		= $(this.inputId).getAttribute('maxLength')!=null?$(this.inputId).getAttribute('maxLength'):'';*/
			
			field_size 		= prop.size ? prop.size.value : undefined;
			max_length 		= prop.maxsize? prop.maxsize.value : undefined;
			
			default_value 	= prop.defaultValue.value;
			required 		= prop.required.value=='Yes'?true:false;
			hint_desc		= prop.description.value;			
			loged_user 		= prop.islogged.value=='Yes'?true:false;
			allow_duplicate	= prop.dulicate.value=='Yes'?true:false;			
			label			= prop.text.value!=''?prop.text.value:label
			
			
		}
		//alert(prop.validation.value)
		//alert(prop.dbfieldName.value)
	this.objectProperties = {"field_label":label,
								"field_type":this.elementType,
								"field_size":field_size,
								"max_length":max_length,
								"default_value":default_value,
								"required":required,
								"allow_duplicate":allow_duplicate,
								"loged_user":loged_user,
								"hint_desc" :hint_desc,
								"association":prop.association.value,
								"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
								"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value,
								"field_mask": prop.fieldMask !== undefined ? prop.fieldMask.value : undefined
								};	
								

  },
  getDropdownProp:function(){
	var field_size 	= '';
	var column	= 1;
	var label	=	'Radio label';	
	var options_prop_list = '';
	var divEle = $$('#id_' + this.id + ' div.question-input').first();
	var selected ='';
	var isLimitCheckBox = false;
	//divEle.setAttribute('style','border:solid 1px red');
	
	if(divEle)
		{
			
			var prop = (divEle.retrieve('properties'));		
			label			= prop.text.value!=''?prop.text.value:label	;		

			hint_desc		= prop.description.value;
			isLimitCheckBox	= prop.limit.value;
			
			loged_user 		= prop.islogged.value=='Yes'?true:false;
			
			required 		= prop.required.value=='Yes'?true:false;
			
			selected		= prop.selected.value;
			
			//divEle.setAttribute('style','border:solid 1px green')
			var opts = prop.options.value.split("|");			
			var inputType = prop.type.value.replace('control_', '');
			var chk_selected = prop.selected.value;		
			var chkHtml='';
			var chkProp ='';
		
			for(var i=0;i< opts.length;i++)			{
				var rd_selected = chk_selected == opts[i] ? 'checked="checked"' : ''
				
				chkHtml +='<div class="field-alternative-chk chk_lim_prop">'
					chkHtml +='<input type="radio" value="'+opts[i]+'" style="" onchange="setDropdownSelection(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_dropdown" '+rd_selected+' name="radio_ele" >';		
				chkHtml +='</div>'
				chkHtml +='<div class="field-alternative-div chk_lim_prop">'
					chkHtml +='<input type="text" size="15" style="height:15px" value="'+opts[i]+'" onkeyUp="setDropdownLabel(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_input_add" class="add_text">'
					chkHtml +='<input type="button" class="add_chk" onclick="addCheckBox(\''+this.id+'\')" id="label_input_'+this.id+"_"+i+'_chk_add">';
					if(i>0)
					chkHtml +='<input type="button" class="sub_chk" onclick="removeDropdownItem(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_chk_rem">';	
					
				chkHtml +='</div>'
				
				chkProp +='<div class="field-alternative-div"><input type="text" size="5" style="height:15px"></div>';
			}
		}
		 

		//alert(prop.options)		
			this.objectProperties = {"field_label":label,
									"field_type":this.elementType,
									"sub_heading":hint_desc,
									"options_list":chkHtml,
									"isLimitCheckBox":isLimitCheckBox,
									"options_prop_list":chkProp,
									"loged_user":loged_user,
									"required":required,
									"selected":selected,
									"association":prop.association.value,
									"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
									"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value};	
									
	  
	 },
  getRadioButtonProp:function(){
	var field_size 	= '';
	var column	= 1;
	var label	=	'Radio label';	
	var options_prop_list = '';
	var divEle = $$('#id_' + this.id + ' div.question-input').first();
	var selected ='';
	var isLimitCheckBox = false;
	//divEle.setAttribute('style','border:solid 1px red');
	
	if(divEle)
		{
			
			var prop = (divEle.retrieve('properties'));		

			label			= prop.text.value!=''?prop.text.value:label	;		
			column			= prop.spreadCols.value?prop.spreadCols.value:column;
			hint_desc		= prop.description.value;
			isLimitCheckBox	= prop.limit.value;
			loged_user 		= prop.islogged.value=='Yes'?true:false;
			required 		= prop.required.value=='Yes'?true:false;
			selected		= prop.selected.value;
			//divEle.setAttribute('style','border:solid 1px green')
			var opts = prop.options.value.split("|");			
			var inputType = prop.type.value.replace('control_', '');
			var chk_selected = prop.selected.value;		
			var chkHtml='';
			var chkProp ='';
			
			for(var i=0;i<opts.length;i++)			{
				var rd_selected = chk_selected == opts[i] ? 'checked="checked"' : ''
				
				chkHtml +='<div class="field-alternative-chk chk_lim_prop">'
					chkHtml +='<input type="' + inputType +'" value="'+opts[i]+'" style="" onchange="setRadioButtonSelection(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_radio" '+rd_selected+' name="radio_ele" >';		
						chkHtml +='</div>'
				chkHtml +='<div class="field-alternative-div chk_lim_prop">'
					chkHtml +='<input type="text" size="15" style="height:15px" value="'+opts[i]+'" onkeyUp="setRadioButtonLabel(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_input_add" class="add_text">'
					chkHtml +='<input type="button" class="add_chk" onclick="addCheckBox(\''+this.id+'\')" id="label_input_'+this.id+"_"+i+'_chk_add">';
					if(i>0)
					chkHtml +='<input type="button" class="sub_chk" onclick="removeChecckBox(\''+this.id+'\',this,'+i+',\'radio\')" id="label_input_'+this.id+"_"+i+'_chk_rem">';	
					
				chkHtml +='</div>'
				
				chkProp +='<div class="field-alternative-div"><input type="text" size="5" style="height:15px"></div>';
			}
		}
		
	
		//alert(prop.options)		
			this.objectProperties = {"field_label":label,
									"field_type":this.elementType,									
									"column":column,
									"sub_heading":hint_desc,
									"options_list":chkHtml,
									"isLimitCheckBox":isLimitCheckBox,
									"options_prop_list":chkProp,
									"loged_user":loged_user,
									"required":required,
									"selected":selected,
									"association":prop.association.value,
									"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
									"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value};	
									
	  
	 },
  getCheckBoxProp:function(){
	var field_size 	= '';
	var column	= 1;
	var label	=	'Label';
	var isLimitCheckBox = false;
	var options_prop_list = '';
	var divEle = $$('#id_' + this.id + ' div.question-input').first();
	var selected ='';
	if(divEle)
		{
			
			var prop = (divEle.retrieve('properties'));		

			label			= prop.text.value!=''?prop.text.value:label	;		
			column			= prop.spreadCols.value?prop.spreadCols.value:column;
			hint_desc		= prop.description.value;
			isLimitCheckBox	= prop.limit.value;
			loged_user 		= prop.islogged.value=='Yes'?true:false;
			required 		= prop.required.value=='Yes'?true:false;
			selected		= prop.selected.value;
			//divEle.setAttribute('style','border:solid 1px green')
			var opts = prop.options.value.split("|");			
			var inputType = prop.type.value.replace('control_', '');
			var chk_selected = prop.selected.value.split("|");		
			var chkHtml='';
			var chkProp ='';
			
			for(var i=0;i<opts.length;i++)			{
				var rd_selected = chk_selected.include(opts[i]) ? 'checked="checked"' : ''
				
				chkHtml +='<div class="field-alternative-chk chk_lim_prop">'
					chkHtml +='<input type="' + inputType +'" value="'+opts[i]+'" style="" onchange="setCheckBoxSelection(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_checkbox" '+rd_selected+' >';	
					chkHtml +='</div>'
				chkHtml +='<div class="field-alternative-div chk_lim_prop">'	
					chkHtml +='<input type="text" size="15" style="height:15px" value="'+opts[i]+'" onkeyUp="setCheckBoxLabel(\''+this.id+'\',this)" id="label_input_'+this.id+"_"+i+'_input_add" class="add_text">'
					chkHtml +='<input type="button" class="add_chk" onclick="addCheckBox(\''+this.id+'\')" id="label_input_'+this.id+"_"+i+'_chk_add">';
					if(i>0)
					chkHtml +='<input type="button" class="sub_chk" onclick="removeChecckBox(\''+this.id+'\',this,'+i+',\'checkbox\')" id="label_input_'+this.id+"_"+i+'_chk_rem">';	
					
				chkHtml +='</div>'
				
				chkProp +='<div class="field-alternative-div"><input type="text" size="5" style="height:15px"></div>';
			}
		}
		
		
		//alert(prop.options)		
			this.objectProperties = {"field_label":label,
									"field_type":this.elementType,									
									"column":column,
									"sub_heading":hint_desc,
									"options_list":chkHtml,
									"isLimitCheckBox":isLimitCheckBox,
									"options_prop_list":chkProp,
									"loged_user":loged_user,
									"required":required,
									"selected":selected,
									"association":prop.association.value,
									"dbname":prop.dbname == undefined ? '' : prop.dbname.value,
									"dbfield_name":prop.dbfieldName == undefined ? '' :prop.dbfieldName.value};	
	  
	  },
  getElementType:function()
	{
		if(this.id != 'stage')
		{
			this.isForm = false;
			//alert(this.id)
			return ($('id_'+this.id).type);
		}
		else
		{
			this.isForm = true;
			return 'form';
			
		}
		//return this.id
	},
  show: function(message) {
    return this.name + ': ' + message;
  }
};
	var theSelectList = $('theBigFatSelectList');



function AddSelectOption(selectObj, text, value, isSelected) 
{
    if (selectObj != null && selectObj.options != null)
    {
        selectObj.options[selectObj.options.length] = 
            new Option(text, value, false, isSelected);
    }
}
function removeHeightLighted()
{


	$$('tr').each(function(e){
				 
		e.removeClassName('heighlite')
										   
	})
}

function setHeightLighted(id){
	
	$$('tr').each(function(e){
				 
		e.removeClassName('heighlite')
										   
	})
	

	
	$$('.row-'+id).each(function(e){
		
		e.addClassName('heighlite')
										   
	})
	

}
function viewFieldsList()
{
	
	$('common_fields').hide();
	//$$('.tip_database').tooltip();
	$('tip_database').title="Show the fields for selected database"
	customeToolTip('tip_database')
	//

	//Event.stopObserving('view_field_link', 'click');

	//alert(divEle)
	$('databasename_span').update($('related_database').options[$('related_database').selectedIndex].textContent).insert(aEle)
	
	if((edit_prop === undefined || $('related_database').value ==edit_prop["database_id"] ) ||  (!isChildForm && !EDIT_MODE))
	{
		$('form_fields').show()
		var divEle = new Element('div').setStyle('float:left;')
	
		var aEle = new Element('a',{id:"change_link"},this).observe('click', function () {
				unselectField();
				$('related_database').focus()
			})
		//alert(aEle)
		aEle.innerHTML=" (change) "	//divEle.insert(img).setStyle('text-align:center;')
		divEle.insert(aEle)
		$('databasename_span').update($('related_database').options[$('related_database').selectedIndex].textContent).insert(aEle)
		showFields(2)
		CommonClass.setLoadingIndicator();
		
		var url = CUSTOM_URL+'/buildders/'+$('related_database').value+'/merge_field_form'
		new Ajax.Request(url, {
           parameters: {     
					
                },
			onCreate:startLoading('toolbarformfields'),
			
			
            evalJSON: true,            
            method: 'GET',
            onComplete: function (t) {
				
                try {
					$('toolbarformfields').update(t.responseJSON.html)
					
						if(!t.responseJSON.error)
						{
							isChildForm = true
							databaseId = $('related_database').value;
							MergeElementProperties.eleProp = t.responseJSON.script
						  	$$('.tools').each(function toolsLoop(toolbox) {
								 toolboxContents[toolbox.id] = toolbox.innerHTML;
							 
							});
							setClicks();
							createControls();
							$('toolbarformfields').setStyle('padding-left:0px;')
						}
						else
						{	
							MergeElementProperties.eleProp = {}
							$('toolbarformfields').setStyle('padding-left:23px;')
						}
						
						
						
                	} catch (e) {
                    console.error(e, 'Error');
                }
            }
        },this);
		/*this.windowTitle = 'Database Fields'.locale(),
		this.width = 300,
		this.height = "auto"
		this.contentPadding = 0,
		this.dynamic = false,
		this.wizardWin = null,
		// close button properties
		this.closeButtonTitle = 'Close'.locale(),
		this.closeButtonName = 'close',
		this.HTMLEditor = null,
		this.closeButton = {		
			title:this.closeButtonTitle,
			name:this.closeButtonName,
			handler:function(window){
				
				window.close();
			}
		},
		
			
		this.onClose = function (){
			sourceLink = false;
			document._onedit = false;
		},
		this.openWizard = function (div){
		//this.onInsert = shareWizardAccordionManager
		BuildSource.init(getAllProperties());
			this.wizardWin = document.window({
			   title: windowTitle,
				width: this.width,
				height:this.height,
				contentPadding: this.contentPadding,
				content: div,
				dynamic: this.dynamic,
				//onInsert: this.onInsert,
				onClose: this.onClose,
				buttons:[ this.closeButton],
				position:''
			});
		  this.wizardWin.reCenter();
		},
		
		Utils.loadTemplate(url, function(source) {
			var div = new Element("div");			
			div.innerHTML = source;
			this.openWizard(div);								  
		})*/
	}
	else{
		$('form_fields').hide()
		$('common_fields').show();
		if(!isChildForm)
		{
			Utils.alert('As this is parent form,You can only add new fields.'.locale(),'Error');	
			$('related_database').disabled = "disabled"
			showFields(2)
			if($('view_field_link'))
				$('view_field_link').hide();
		}
		else	
			Utils.alert('You cant\'t change database'.locale(),'Error');		
	}
	
}

function startLoading(id)
{
	var divEle = new Element('div');
	var img = new Element('img', {
			src: '/sistema/images/builder/small-ajax-loader.gif'
		});
	divEle.insert(img).setStyle('text-align:center;')
	
	$(id).update(divEle)
}
function getList(){
   
   // submit the form 
    jQuery('#uploadForm').ajaxSubmit(function(obj){
			
			if(obj.length)
				{
					jQuery('#list_div').show()					
					jQuery('#errorP').hide()
					jQuery('#list_txtarea').html (obj)
					

				}
			else{
					jQuery('#list_div').hide('fast')
					jQuery('#errorP').show();//setAttribute('style','display:block;margin-left: 35px;font-size: 14px;float: left;')
					jQuery('#errorP').html('No elements found')
			}
		}); 
    // return false to prevent normal browser submit and page navigation 
    return false; 

};
function mergerObject(o1,o2)
{

 for(var i in o2) { o1[i] = o2[i]; }
	return o1;    
	
}
function addEmailToSendConfirmation()
{
	
	var theSelectBox = $('send_to');
		theSelectBox.innerHTML=''
		AddSelectOption(theSelectBox, "E-mail field", 0, false);	
		var isSelected = false
		$$('#list li').each(function(liTag){
			if(liTag.type=="control_email"){			
				
				var emaiBox = $$('#'+liTag.id+' div.question-input input[type=email]').first()
				if(emaiBox!==undefined)
				{
					var divEle = $$('#'+liTag.id+' div.question-input').first();
					if(divEle!==undefined)
					{
						var selctedEmailEle = $('stage').getProperty('confirmationEmailId');		
						var liId = liTag.id.toString().replace("id_","")
						if ( selctedEmailEle == liId)
							isSelected = true
						else 
							isSelected = false
						AddSelectOption(theSelectBox, divEle.getProperty('text'), liId, isSelected);	
					}
				}
				
				
		}
	})
	
}

function radioSelectionConfirmationMail(selected){
	
	
	if("email_url"==selected)
		{
			jQuery("#show_textarea_email").hide("slow");
			jQuery("#show_url_email").show("slow");
	}else{
		jQuery("#show_url_email").hide("slow");
			jQuery("#show_textarea_email").show("slow");
	}	
}
function addDatePicker(className)
{

	var divEle = getQuestionSelectedInput()
	var format = divEle.getProperty('format')
	$$('.'+className+'').each( function(e) {
										//		alert(e)			   
											//					   alert(Control.DatePicker.i18n.baseLocales.us.dateFormat)
			var obj = new Control.DatePicker(e, { 'icon': '/sistema/images/builder/calendar.png','dateFormat':'dd/MM/yyyy','onSelect':function(o){
				// RIght any code for o obj
			}}); 
			
			
		} );
	}
function customCssForTab()
{
	jQuery('#li_a_3').removeClass('add-custom-padding-li-3')
	jQuery('#li_a_2').removeClass('add-custom-padding-li-2')
	
}
function isAnyFieldSelected()
{
		return getQuestionSelectedLi();
}
function addOptionsFromTextArea()
	{
		
		var list = new Array();
			list = $('list_txtarea').value.split("\n")		
			
			if($('list_txtarea').value.strip().length<1)			
			return false
				
			list = jQuery.grep(list,function(n,i){return(n); });
			
			list = list.join("|")
			
			addCheckBox(false,list)

	}
function formPreview(){
//	alert(1)	
	formPreviewOnWindow()
}	



