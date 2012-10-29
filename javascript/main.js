$(document).ready(function(){
    reservationChart = $.parseJSON(jsonData);
    $.each(reservationChart,function(){
        $.each(this.schedule,function(){
            this.from = new Date(this.from);
            this.from = new Date(this.from.getTime() + (this.from.getTimezoneOffset() * 60000));
            this.to = new Date(this.to);
            this.to = new Date(this.to.getTime() + (this.to.getTimezoneOffset() * 60000));
            this.duration = (this.to.getTime() - this.from.getTime())/60000;
        })
    });
    reservationManager.init(reservationChart);  

});

var reservationManager = (function(){
    var $timeChart,
        $tables,
        $reservationChartContainer,
        $newReservationContainer,
        schedule,
        vacantSlots = [],
        hourPixelEquivalentLength = 100,
        autoScrollTimeoutId,
        newReservation = {
            people: 3,
            duration: 60
        };

    function createReservationGrid(){
        for(var i = 0,totalTables = schedule.length; i < totalTables; i++){
            processTableSchedule(schedule[i]).appendTo($tables);
        }
    };
    
    function processTableSchedule(table){
        var $table = $('<div/>',{
            "class":"table-" + table.tableNumber,
            id: "T" + table.tableNumber
        });
        for(var i = 0, totalHours = table.schedule.length; i < totalHours; i++){
            var tableSlot = table.schedule[i];
            var div = $("<div/>", {
                id : "tableSlot_" + table.tableNumber +"_"+ i,
                "class": (tableSlot.reserved ? 'reservation' : 'vacant-slot')
            }).css('width',
                ((tableSlot.duration/60) * hourPixelEquivalentLength)
            )
            .appendTo($table);
            tableSlot.element = div;
            if(!tableSlot.reserved) vacantSlots.push(tableSlot);
        }
        return $table;
    };

    function createTimeScale(){
        var startTime = schedule[0].schedule[0].from,
            endTime = schedule[0].schedule[schedule[0].schedule.length-1].to,
            timeChartHTMLString = '';
        for(var i = startTime.getHours()+1; i <= endTime.getHours();i++){
            timeChartHTMLString += '<div class="time-slot"></div><div class="time-slot"></div><div class="time-slot"></div><div class="time-slot hour-separator">' + i + ':00</div>';
        }
        $timeChart.html(timeChartHTMLString);

    };

    function initNewReservation(){
        $newReservationContainer = $('#newReservations');
        var $newReservation = $('<div></div>').attr({
                'class':'new-reservation'        
            }).css({
                'height': (newReservation.people * 30),
                'width': (newReservation.duration/60 * hourPixelEquivalentLength)
            }).append($('<label></label>').text(newReservation.people +' people ' + newReservation.duration/60 + ' hour(s)'));

            newReservation.element = $newReservation;

            $newReservation.appendTo($newReservationContainer);
            newReservation.originalOffset = $newReservation.offset();
    }

    function init(reservationSchedule){
        $reservationChartContainer = $("#reservationChart");
        $timeChart = $('#timeChart');
        $tables = $('#tables');
        schedule = reservationSchedule;
        updateTimeChartAndTableContainerWidth();
        createTimeScale();
        createReservationGrid();
        initNewReservation();
        initDragModule(newReservation);
        initDropSpots();
        initNavButtons();
    };

    function updateTimeChartAndTableContainerWidth(){
        var totalContainerLength = (schedule[0].schedule.length+1) * 100;
        $timeChart.css('width',totalContainerLength);
        $tables.css('width',totalContainerLength);
    };

    function initNavButtons(){
        var scrollOffset = 700;
        $('#btnLeft').on('click',function(e){
            e.preventDefault();
            var currentScrollPosition = $reservationChartContainer.scrollLeft();
            $reservationChartContainer.scrollLeft(currentScrollPosition - scrollOffset);
            console.log($reservationChartContainer.scrollLeft());
        })
        .droppable({
            tolerance:"intersect",
            accept: '.new-reservation',
            over: function(event,ui){
                autoScrollTimeoutId = setInterval(function(){
                    console.log('scrolling left button');
                    var currentScrollPosition = $reservationChartContainer.scrollLeft();    
                    $reservationChartContainer.scrollLeft(currentScrollPosition - scrollOffset);
                },2000);
            },
            out: function(event, ui){
                clearInterval(autoScrollTimeoutId);
            }

        });
        $('#btnRight').on('click',function(e){
            e.preventDefault();
            var currentScrollPosition = $reservationChartContainer.scrollLeft();
            $reservationChartContainer.scrollLeft(currentScrollPosition + scrollOffset);
            console.log($reservationChartContainer.scrollLeft());
        })
        .droppable({
            tolerance:"intersect",
            accept: '.new-reservation',
            over: function(event,ui){
                autoScrollTimeoutId = setInterval(function(){
                    console.log('scrolling right button');
                    var currentScrollPosition = $reservationChartContainer.scrollLeft();    
                    $reservationChartContainer.scrollLeft(currentScrollPosition + scrollOffset);
                },2000);
            },
            out: function(event, ui){
                clearInterval(autoScrollTimeoutId);
            }
        });
    }
    /*DRAG DROP MODULE*/
    var currentReservation,
        $currentReservation,
        reservationDragged = false;

    function initDragModule(newReservation){
        newReservation.element  
            .on('mousedown',function(){
                currentReservation = newReservation;
                $currentReservation = $(this);
                reservationDragged = false;
                if($currentReservation.hasClass('reservation-added')){
                    var vacantSlotObject = getAssociatedSlotObject($currentReservation.nextAll('.vacant-slot').first().attr('id'));
                    updateVacantSpot(vacantSlotObject, false);
                    $currentReservation = $currentReservation.detach();
                    $currentReservation.appendTo($newReservationContainer)
                        .css({float:'none',left:$currentReservation.data('leftDiff'),top:$currentReservation.data('topDiff'),position:'relative'})
                        .addClass('dragged new-reservation')
                        .draggable('options',{revert:'invalid'})
                        .removeClass('reservation-added');
                }
                highlightSuitableVacantSpots();
            })
            .on('mouseup',function(){
                if(!reservationDragged){
                    removeHighlightsFromVacantSpots();
                    revertToOriginalPosition($(this));
                }
            })
            .draggable({
                revert: 'invalid',
                start: function(event,ui){
                    reservationDragged = true;
                    $(this).addClass('dragged');
                    highlightSuitableVacantSpots();
                },

                stop: function(event, ui) {
                    removeHighlightsFromVacantSpots();
                    $(this).removeClass('dragged');
                    clearInterval(autoScrollTimeoutId);
                },
                revert: function(event, ui){
                    revertToOriginalPosition($(this));
                    return !event;
                }
            });
    };

    function highlightSuitableVacantSpots(){
        $.each(reservationChart,function(){
            if(this.tableCapacity >= newReservation.people){
                $.each(this.schedule,function(){
                    if(!this.reserved && this.duration >= newReservation.duration){
                        this.element.addClass('highlight-vacancy')
                            .droppable('option','disabled',false);
                    }
                });
            }
        });
    };

    function removeHighlightsFromVacantSpots(){
        $('.highlight-vacancy').removeClass('highlight-vacancy')
            .droppable('option','disabled',true);
    };

    function initDropSpots(){
        $.each(reservationChart,function(){
            var table = this;
            $.each(this.schedule,function(){
                if(!this.reserved){
                    makeDropSpot(table, this);
                }
            });
        });
    }

    function makeDropSpot(table, vacantSpot){
        
        vacantSpot.element.droppable({
            tolerance:"intersect",
            disabled: true,
            hoverClass: 'draggable-object-over',
            drop: function( event, ui ) {
                if(confirm(createConfirmationString(table, vacantSpot, currentReservation.duration))){
                    updateVacantSpot(vacantSpot, true);

                    var leftDiffBetweenVacantAndOriginal =
                        vacantSpot.element.offset().left -  newReservation.originalOffset.left;

                    var topDiffBetweenVacantAndOriginal =
                        vacantSpot.element.offset().top - newReservation.originalOffset.top;

                    $currentReservation.data('leftDiff',leftDiffBetweenVacantAndOriginal+'px');
                    $currentReservation.data('topDiff',topDiffBetweenVacantAndOriginal+'px');

                    $currentReservation.removeClass('new-reservation dragged')
                        .addClass('reservation-added')
                        .css({float:'left',position:'static'})
                        .insertBefore($(this));
                }
            }
        });
    };

    function createConfirmationString(table,vacantSpot,duration){
        var endTime =  new Date(vacantSpot.from.getTime() + duration * 60000); 
        var confirmationString =  "Do you want to reserve table T" + table.tableNumber;
            confirmationString += " from " + vacantSpot.from.getHours() + ":" + (vacantSpot.from.getMinutes()== 0 ? "00" : vacantSpot.from.getMinutes());
            confirmationString += " to " + endTime.getHours() + ":" + (vacantSpot.from.getMinutes()== 0 ? "00" : vacantSpot.from.getMinutes());
            confirmationString += "?";
        return confirmationString;
    };
    
    function updateVacantSpot(vacantSpot, reservationMade){
        var updateDuration = reservationMade ? currentReservation.duration : - currentReservation.duration;
        vacantSpot.from = new Date(vacantSpot.from.getTime() + (updateDuration* 60000));
        vacantSpot.duration -= updateDuration;
        vacantSpot.element.width((vacantSpot.duration /60) * hourPixelEquivalentLength );

    }
    function revertToOriginalPosition($element){
        $element.data('draggable').originalPosition = {
                        left: 0,
                        top: 0
                    };
        $element.animate({top:0,left:0});
    }

    function getAssociatedSlotObject(slotId){
        for(var i=0,len = vacantSlots.length;i<len;i++){
            if(vacantSlots[i].element.attr('id')==slotId){
                return vacantSlots[i];
            }
        }
    }
    return{
        init: init,
        newReservation : newReservation
    }
})();