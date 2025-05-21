$(document).foundation();
    $(document).ready(function () {

        $("#cy").hide();

        $.get({
            // getting the data
            url: 'https://us-central1-fatplantsmu-eb07c.cloudfunctions.net/godata',
            success: function (data) {
                $("#loading").hide();
                $("#cy").show();

                var elementsdata = data;
                var cy = window.cy = cytoscape({

                    container: document.getElementById('cy'),
                    elements: elementsdata,
                    autounselectify: true,
                    boxSelectionEnabled: false,

                });

                var nodeDescriptionData = null;
                // get node description info
                $.get({
                    url: 'https://us-central1-fatplantsmu-eb07c.cloudfunctions.net/gonodedescription',
                    success: function (data) {

                        nodeDescriptionData = data;

                    }
                });

                cy.on('mouseover', 'node', function(event){

                    var node = event.target;
                    nodeData = node.data();

                    for( var j=0;j<nodeDescriptionData.length;j++){
                        if(nodeData['id'] == nodeDescriptionData[j]['GO']){
                            var tippyA = tippy(node.popperRef(), {
                                content: nodeDescriptionData[j]['Description'].split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' '),
                                interactive: true,
                                animation: 'perspective',
                                trigger: 'manual'
                            });

                            tippyA.show();
                            break;
                        }
                    }
                });

                cy.on('mouseout', 'node', function(event){

                    $('.tippy-popper').remove();

                });

                $("#layout1").click(function(){
                    var layout = cy.layout({
                        name: 'cose',
                        idealEdgeLength: 100,
                        nodeOverlap: 20,
                        refresh: 20,
                        fit: true,
                        padding: 30,
                        randomize: false,
                        componentSpacing: 100,
                        nodeRepulsion: 400000,
                        edgeElasticity: 100,
                        nestingFactor: 5,
                        gravity: 80,
                        numIter: 1000,
                        initialTemp: 200,
                        coolingFactor: 0.95,
                        minTemp: 1.0
                    });
                    layout.run();

                    cy.style()
                        .resetToDefault() // start a fresh default stylesheet
                        .fromJson([
                            {
                                "selector": "core",
                                "style": {
                                "selection-box-color": "#AAD8FF",
                                "selection-box-border-color": "#8BB0D0",
                                "selection-box-opacity": "0.5"
                                }
                            }, {
                                "selector": "node",
                                "style": {
                                "width": "mapData(score, 0, 0.006769776522008331, 20, 60)",
                                "height": "mapData(score, 0, 0.006769776522008331, 20, 60)",
                                "content": "data(name)",
                                "font-size": "12px",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#555",
                                "text-outline-color": "#555",
                                "text-outline-width": "2px",
                                "color": "#fff",
                                "overlay-padding": "6px",
                                "z-index": "10"
                                }
                            }, {
                                "selector": "node[?attr]",
                                "style": {
                                "shape": "rectangle",
                                "background-color": "#aaa",
                                "text-outline-color": "#aaa",
                                "width": "16px",
                                "height": "16px",
                                "font-size": "6px",
                                "z-index": "1"
                                }
                            }, {
                                "selector": "node[?query]",
                                "style": {
                                "background-clip": "none",
                                "background-fit": "contain"
                                }
                            }, {
                                "selector": "node:selected",
                                "style": {
                                "border-width": "6px",
                                "border-color": "#AAD8FF",
                                "border-opacity": "0.5",
                                "background-color": "#77828C",
                                "text-outline-color": "#77828C"
                                }
                            }, {
                                "selector": "edge",
                                "style": {
                                "curve-style": "haystack",
                                "haystack-radius": "0.5",
                                "opacity": "0.4",
                                "line-color": "#bbb",
                                "width": "mapData(weight, 0, 1, 1, 8)",
                                "overlay-padding": "3px"
                                }
                            }, {
                                "selector": "node.unhighlighted",
                                "style": {
                                "opacity": "0.2"
                                }
                            }, {
                                "selector": "edge.unhighlighted",
                                "style": {
                                "opacity": "0.05"
                                }
                            }, {
                                "selector": ".highlighted",
                                "style": {
                                "z-index": "999999"
                                }
                            }, {
                                "selector": "node.highlighted",
                                "style": {
                                "border-width": "6px",
                                "border-color": "#AAD8FF",
                                "border-opacity": "0.5",
                                "background-color": "#394855",
                                "text-outline-color": "#394855"
                                }
                            }, {
                                "selector": "edge.filtered",
                                "style": {
                                "opacity": "0"
                                }
                            }, {
                                "selector": "edge[group=\"1\"]",
                                "style": {
                                "line-color": "#d0b7d5"
                                }
                            }, {
                                "selector": "edge[group=\"2\"]",
                                "style": {
                                "line-color": "#a0b3dc"
                                }
                            }, {
                                "selector": "edge[group=\"3\"]",
                                "style": {
                                "line-color": "#90e190"
                                }
                            }, {
                                "selector": "edge[group=\"4\"]",
                                "style": {
                                "line-color": "#9bd8de"
                                }
                            }, {
                                "selector": "edge[group=\"5\"]",
                                "style": {
                                "line-color": "#eaa2a2"
                                }
                            }, {
                                "selector": "edge[group=\"6\"]",
                                "style": {
                                "line-color": "#f6c384"
                                }
                            }, {
                                "selector": "edge[group=\"7\"]",
                                "style": {
                                "line-color": "#dad4a2"
                                }
                            }, {
                                "selector": "edge[group=\"8\"]",
                                "style": {
                                "line-color": "#D0D0D0"
                                }
                            }, {
                                "selector": "edge[group=\"9\"]",
                                "style": {
                                "line-color": "#D0D0D0"
                                }
                            }, {
                                "selector": "edge[group=\"10\"]",
                                "style": {
                                "line-color": "#D0D0D0"
                                }
                            }, {
                                "selector": "edge[group=\"11\"]",
                                "style": {
                                "line-color": "#f0ec86"
                                }
                            }
                        ])

                        .update() // indicate the end of your new stylesheet so that it can be updated on elements
                    ;

                    $('.button').removeClass('disabled')
                    $(this).addClass('disabled')

                });


                $("#layout2").click(function(){
                    // var layout = cy.layout({
                    //     name: 'cola',
                    //     maxSimulationTime: 3000,
                    // });
                    // layout.run();
                    //
                    // cy.style()
                    //     .resetToDefault() // start a fresh default stylesheet
                    //     .fromJson([{
                    //         "selector": "node",
                    //         "style": {
                    //         "width": "mapData(score, 0, 0.006769776522008331, 20, 60)",
                    //         "height": "mapData(score, 0, 0.006769776522008331, 20, 60)",
                    //         "content": "data(name)",
                    //         "font-size": "12px",
                    //         "text-valign": "center",
                    //         "text-halign": "center",
                    //         "background-color": "red",
                    //         "color": "black",
                    //         "overlay-padding": "6px",
                    //         "z-index": "10"
                    //         }
                    //     },
                    //     ])
                    //     // // and then define new styles
                    //     // .selector('node')
                    //     //     .style('background-color', '#f92411')
                    //     // .selector('node')
                    //     //     .style('label', 'data(id)')
                    //     // .selector('node')
                    //     //     .style('text-valign', 'center')
                    //     .selector('edge')
                    //         .style('line-color', '#f92411')
                    //
                    //     .update() // indicate the end of your new stylesheet so that it can be updated on elements
                    // ;
                    //
                    // $('.button').removeClass('disabled')
                    // $(this).addClass('disabled')
                  cy.stop()
                  cy.clearQueue()


                  function changeLayout(callback) {
                    cy.startBatch();

                    var layout = cy.layout({
                      name: 'cola',
                      maxSimulationTime: 2000,
                    });
                    layout.run();

                    callback();
                  }

                  changeLayout(function() {
                    cy.endBatch();
                    cy.stop()
                    cy.clearQueue()
                  });

                  $('.button').removeClass('disabled')
                  $(this).addClass('disabled')

                  cy.stop()
                  cy.clearQueue()

                });

                $("#layout3").click(function(){
                    // var layout = cy.layout({
                    //     name: 'circle'
                    // });
                    // layout.run();
                    //
                    // cy.style()
                    //     .resetToDefault() // start a fresh default stylesheet
                    //     .fromJson([
                    //         {
                    //             selector: 'node',
                    //             style: {
                    //                 'height': 20,
                    //                 'width': 20,
                    //                 'background-color': '#e8e406',
                    //                 "content": "data(name)",
                    //                 "font-size": "12px",
                    //                 "text-valign": "center",
                    //                 "text-halign": "center",
                    //                 "color": "black",
                    //                 "overlay-padding": "6px",
                    //                 "z-index": "10"
                    //             }
                    //             },
                    //
                    //             {
                    //             selector: 'edge',
                    //             style: {
                    //                 'curve-style': 'haystack',
                    //                 'haystack-radius': 0,
                    //                 'width': 5,
                    //                 'opacity': 0.5,
                    //                 'line-color': '#f2f08c'
                    //             }
                    //         }
                    //     ])
                    //
                    //     .update() // indicate the end of your new stylesheet so that it can be updated on elements
                    // ;
                    //
                    // $('.button').removeClass('disabled')
                    // $(this).addClass('disabled')
                  $('#layout4').trigger('click');
                  cy.stop()
                  cy.clearQueue()

                  function changeLayout(callback) {
                    cy.startBatch();

                    var layout = cy.layout({
                      name: 'circle'
                    });
                    layout.run();

                    callback();
                  }

                  changeLayout(function() {
                    cy.endBatch();
                    cy.stop()
                    cy.clearQueue()
                    const ext = cy.extent()
                    const nodesInView = cy.nodes().filter(n => {
                      const bb = n.boundingBox()
                      return bb.x1 > ext.x1 && bb.x2 < ext.x2 && bb.y1 > ext.y1 && bb.y2 < ext.y2
                    })
                    console.log(nodesInView.length)
                  });

                  $('.button').removeClass('disabled')
                  $(this).addClass('disabled')

                  cy.stop()
                  cy.clearQueue()

                });

                $("#layout4").click(function(){
                    // var layout = cy.layout({
                    //     name: 'concentric',
                    //     concentric: function( node ){
                    //         return node.degree();
                    //     },
                    //     levelWidth: function( nodes ){
                    //         return 2;
                    //     }
                    // });
                    // layout.run();
                    //
                    // cy.style()
                    //     .resetToDefault() // start a fresh default stylesheet
                    //     .fromJson([
                    //         {
                    //             selector: 'node',
                    //             style: {
                    //                 'background-color': '#30c9bc',
                    //                 'text-valign': 'center',
                    //                 "width": "mapData(score, 0, 0.006769776522008331, 20, 60)",
                    //                 "height": "mapData(score, 0, 0.006769776522008331, 20, 60)",
                    //                 "content": "data(name)",
                    //                 "font-size": "12px",
                    //                 "text-halign": "center",
                    //                 "color": "black",
                    //                 "overlay-padding": "6px",
                    //                 "z-index": "10"
                    //             }
                    //         },
                    //
                    //         {
                    //             selector: 'edge',
                    //             style: {
                    //                 'curve-style': 'haystack',
                    //                 'haystack-radius': 0,
                    //                 'width': 5,
                    //                 'opacity': 0.5,
                    //                 'line-color': '#a8eae5'
                    //             }
                    //         }
                    //     ])
                    //
                    //     .update() // indicate the end of your new stylesheet so that it can be updated on elements
                    // ;
                    //
                    // $('.button').removeClass('disabled')
                    // $(this).addClass('disabled')
                    //
                    // cy.viewport({
                    //     zoom: 1,
                    //     pan: { x: 100, y: 100 }
                    //   });
                  cy.stop()
                  cy.clearQueue()

                  function changeLayout(callback) {
                    cy.startBatch();

                    var layout = cy.layout({
                      name: 'concentric',
                      concentric: function( node ){
                        return node.degree();
                      },
                      levelWidth: function( nodes ){
                        return 2;
                      }
                    });
                    layout.run();

                    callback();
                  }

                  changeLayout(function() {
                    cy.endBatch();
                    cy.stop()
                    cy.clearQueue()
                    const ext = cy.extent()
                    const nodesInView = cy.nodes().filter(n => {
                      const bb = n.boundingBox()
                      return bb.x1 > ext.x1 && bb.x2 < ext.x2 && bb.y1 > ext.y1 && bb.y2 < ext.y2
                    })
                    console.log(nodesInView.length)
                  });

                  $('.button').removeClass('disabled')
                  $(this).addClass('disabled')

                  cy.stop()
                  cy.clearQueue()

                });

                $("#layout5").click(function(){

            //         var layout = cy.layout({
            //             name: 'avsdf',
						// nodeSeparation: 120
            //         });
            //         layout.run();
            //
            //         cy.style()
            //             .resetToDefault() // start a fresh default stylesheet
            //             .fromJson([
            //                 {
            //                     selector: 'node',
            //                     style: {
            //                         'background-color': '#3a7ecf',
            //                         'text-valign': 'center',
            //                         "width": "mapData(score, 0, 0.006769776522008331, 20, 60)",
            //                         "height": "mapData(score, 0, 0.006769776522008331, 20, 60)",
            //                         "content": "data(name)",
            //                         "font-size": "12px",
            //                         "text-halign": "center",
            //                         "color": "black",
            //                         "overlay-padding": "6px",
            //                         "z-index": "10"
            //
            //                     }
            //                 },
            //                 {
            //                     selector: 'edge',
            //                     style: {
            //                         'width': 2,
            //                         'line-color': '#3a7ecf',
            //                         'opacity': 0.5
            //                     }
            //                 }
            //             ])
            //
            //             .update() // indicate the end of your new stylesheet so that it can be updated on elements
            //         ;
            //
            //         $('.button').removeClass('disabled')
            //         $(this).addClass('disabled')
                  cy.stop()
                  cy.clearQueue()

                  function changeLayout(callback) {
                    cy.startBatch();

                    var layout = cy.layout({
                      name: 'avsdf',
                      refresh: 30,
                      fit: true,
                      padding: 10,
                      ungrabifyWhileSimulating: false,
                      animate: 'end',
                      animationDuration: 500,
                      nodeSeparation: 60
                    });
                    layout.run();

                    callback();
                  }

                  changeLayout(function() {
                    cy.endBatch();
                    cy.stop()
                    cy.clearQueue()
                  });

                  $('.button').removeClass('disabled')
                  $(this).addClass('disabled')

                  cy.stop()
                  cy.clearQueue()

                });

                $('#layout1').trigger('click');

                $('#entity-identifier-submit').click(function(){
                    var searchVariable = $('#entity-identifier-textbox').val()
                    // searchVariable = searchVariable.toLowerCase();
                    var entitiesToInclude = [];
                    var newGraphElements = [];
                  $.get({
                    // getting the data
                    url: 'https://us-central1-fatplantsmu-eb07c.cloudfunctions.net/godata',
                    data: {identifier: searchVariable},
                    success: function (data) {
                      console.log(data)

                      cy.elements().remove();
                      cy.add(data)

                      $('#layout1').trigger('click');
                    }
                  })

                });
            }
        })
    });
