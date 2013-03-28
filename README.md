MMLOrgChart
===========
MMLOrgChart is a jQuery plugin that allows you to automatically generate an organization chart.  It uses [jQuery] [1] and the [jsPlumb] [2] plugin.
[1]: http://jquery.com/ "jQuery"
[2]: http://jsplumbtoolkit.com/jquery/demo.html "jsPlumb"

Example
-------
1. Create an empty div in your webpage and give it an id:

        <div id="example"></div>

2. In your $(document).ready() function create a variable like so:

        var chart = $('#example').MMLOrgChart();

3. MMLOrgChart uses an array of JSON objects that describe each node in the orgchart.  Each node needs an id, title, name, and super property.  

   * id - Unique integer representing the node
   * title - String denoting the title of the person the node represents
   * name - String denoting the name of the person the node represents
   * super - Integer denoting the id of the supervisor of the person the node represents

Use the data() function to initialize your nodes:

        chart.data([{id:1,
        				title:"Provost and Executive Vice President",
        				name:"Dr. Jerome A. Gilbert",
        				super:null,
        				cssStyle:"background-color: #600;border: 1px solid #DFDEDB; color:white;"},
        			{id:2,
        				title:"Dean of Libraries",
        				name:"Frances N. Coleman",
        				super:1,
        				cssStyle:"background-color: #DFDEDB;border: 1px solid #DFDEDB; color:#600;"},
        			{id:3,
        				title:"Associate Dean for Public Services",
        				name:"Gail Peyton",
        				super:2},
        			{id:4,
        				title:"Reference Services and Outreach Program",
        				name:"Gail Peyton",
        				super:3},
        			{id:5,
        				title:"Library Instruction",
        				name:"Deborah Lee<br />(CTL. 0.25 FTE)",
        				super:3},
        			{id:6,
        				title:"Government Documents/Microforms/Current Journals",
        				name:"",
        				super:3},
        			{id:7,
        				title:"Associate Dean for Technical Services",
        				name:"Patricia Matthes (Interim)",
        				super:2}]);

As you can see in nodes 1 and 2, you can customize the css of individual nodes using the cssStyle property.  There is also a cssClass property if you wish to change the style of multiple nodes.

4. All that's left to do is draw the orgchart. This is done with the render() function.

        chart.render();

Other Functions
---------------

**setCSSNodeClass & addCSSNodeClass**

The default class for all nodes is mmloc_node.  To change this use the setCSSNodeClass. This will result in all nodes having a class of "example_node":

        chart.setCSSNodeClass('example_node');

Use addCSSNodeClass to add an additional class. This will result in all nodes having the classes "mmloc_node" and "example_node":

        chart.addCSSNodeClass('example_node');

**setParentStyle**

This can be used to set the css style of all parent nodes in the orgchart. This example gives all parent nodes a box shadow:

        chart.setParentStyle(' -moz-box-shadow: 5px 5px 2px 2px #ccc;' +
        					' -webkit-box-shadow: 5px 5px 2px 2px #ccc;' +
           					' box-shadow: 5px 5px 2px 2px #ccc;');