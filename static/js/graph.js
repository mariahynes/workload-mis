/**
 * Created by Maria on 30/06/2016.
 */

queue()
   .defer(d3.json, "/MIS/teamData")
   .await(makeGraphs);

function makeGraphs(error, projectsJson) {

   //Clean projectsJson data
   var teamData = projectsJson;
   var dateFormat = d3.time.format("%d %B %Y");


   teamData.forEach(function (d) {

       d["date_entered"] = dateFormat.parse(d["date_entered"]);
       //set all dates to first of the month
       d["date_entered"].setDate(1);

       //this will order the date select correctly
       //and then the number will be removed for display
       if (d["month_number"]  <= 9)
       {
           d["month_name"] = "(0" + d["month_number"] + "). " + d["month_name"] ;
       }
       else
       {
           d["month_name"] = "(" + d["month_number"] + "). " + d["month_name"] ;
       }

    });

   //Create a Crossfilter instance
   var ndx = crossfilter(teamData);

   //Define Dimensions

   var yearDim = ndx.dimension(function(d){
        return d["the_year"];
   }) ;

   var monthDim = ndx.dimension(function(d){
        return d["month_name"];
   }) ;

   var monthNumberDim = ndx.dimension(function(d){
        return d["month_number"];
   }) ;
   var dateDim = ndx.dimension(function (d) {
       return d["date_entered"];
   });
    
   var categoryDim = ndx.dimension(function (d) {
       return d["category_name"];
   });
    
   var functionDim = ndx.dimension(function (d) {
       return d["function_name"];
   });
    
   var timeSpentDim = ndx.dimension(function (d) {
       return d["time_spent"];
   });

   var teamDim = ndx.dimension(function (d) {
       return d["team_name"];
   });

   var nameDim = ndx.dimension(function (d) {
       return d["user_name"];
   });

   var modelNameDim = ndx.dimension(function (d) {
       return d["model_name"];
   });

   //Calculate metrics

    var MISByDate = dateDim.group();
    var MISByMonth= monthDim.group();
    var MISByCategory = categoryDim.group();
    var MISByName = nameDim.group();
    var MISByModelName = modelNameDim.group();
    var MISByFunction = functionDim.group();
    var MISByTeam = teamDim.group();
    var MISByTime = timeSpentDim.group();

    var MISByItemsLogged = dateDim.group().reduceCount(function(d){
        return d["time_spent"];
    });
    var totalTimeSpentByMonth= dateDim.group().reduceSum(function (d){
       return (d["time_spent"]/60)/7.5;
    });

    var totalTimeSpentByCategory = categoryDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    var totalTimeSpentByFunction = functionDim.group().reduceSum(function (d){
        return d["time_spent"];
    });


    var totalTimeSpentByModelName = modelNameDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    var totalTimeSpentByName = nameDim.group().reduceSum(function (d){
        //this is in DAYS
        return (d["time_spent"] / 60)/7.5;
    });


    var totalTimeSpentByTeam = teamDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    var all = ndx.groupAll();
    var totalTimeSpent = ndx.groupAll().reduceSum(function (d) {
        return d["time_spent"];
   });

    var max_category = totalTimeSpentByCategory.top(1)[0].value;
    var max_function = totalTimeSpentByFunction.top(1)[0].value;
    var max_modelName = totalTimeSpentByModelName.top(1)[0].value;
    var max_name = totalTimeSpentByName.top(1)[0].value;
    var max_team = totalTimeSpentByTeam.top(1)[0].value;


   //Define values (to be used in charts)
   var minDate = dateDim.bottom(1)[0]["date_entered"];
   var maxDate = dateDim.top(1)[0]["date_entered"];

    newMinDate = new Date(minDate)
    //alert("original date is " + newMinDate);
    newMinDate.setDate(newMinDate.getDate()-30);
    //alert("new date is " + newMinDate);
    newMaxDate = new Date(maxDate)
    newMaxDate.setDate(newMaxDate.getDate()+30);

   //Charts
 //   timeChart_ItemsLogged = dc.barChart("#time-chart-items-logged"); //remove 'var' to make reset link work
    timeChart_TimeSpent = dc.barChart("#time-chart-time-spent"); //remove 'var' to make reset link work
   var monthChart = dc.rowChart("#month-chart");
    nameChart = dc.rowChart("#name-row-chart"); //remove 'var' to make reset link work
   var totalTimeSpentND = dc.numberDisplay("#total-time-spent-nd");
    categoryChart = dc.pieChart("#category-chart"); //remove 'var' to make reset link work
   var totalItemsLoggedND = dc.numberDisplay("#total-items-logged-nd");
   var totalHoursSpentND = dc.numberDisplay("#total-hours-spent-nd");
   var totalMinsSpentND = dc.numberDisplay("#total-mins-spent-nd");
   var totalDaysSpentND = dc.numberDisplay("#total-days-spent-nd");

   selectField = dc.selectMenu('#menu-select')
        .dimension(monthDim)
        .group(MISByMonth)
       .theSize(13)
       .title(function(d){
           return d.key.split(".")[1];
       });

   selectField2 = dc.selectMenu('#menu-select2')
        .dimension(teamDim)
        .group(MISByTeam)
       .title(function(d){
           return d.key;
       });
   selectField3 = dc.selectMenu('#menu-select3')
    .dimension(nameDim)
    .group(MISByName)
    .theSize(10)
   .title(function(d){
       return d.key;
   });

    selectField4 = dc.selectMenu('#menu-select4')
    .dimension(modelNameDim)
    .group(MISByModelName)
    .theSize(43)
   .title(function(d){
       return d.key;
   });

   selectField5 = dc.selectMenu('#menu-select5')
    .dimension(functionDim)
    .group(MISByFunction)
    .theSize(20)
   .title(function(d){
       return d.key;
   });

   totalItemsLoggedND
       .formatNumber(d3.format(","))
       .valueAccessor(function (d) {
           return d;
       })
       .group(all);

   totalTimeSpentND
      .formatNumber(d3.format(""))
      .valueAccessor(function (d) {
            return d;
       })
       .group(totalTimeSpent);

    totalHoursSpentND
      .formatNumber(d3.format(","))
      .valueAccessor(function (d) {
            return Math.floor(d/60);
       })
       .group(totalTimeSpent);

    totalDaysSpentND
      .formatNumber(d3.format(","))
      .valueAccessor(function (d) {
            //return (Math.floor(d/60))/7.5;
            return Math.round((d/60)/7.5);
       })
       .group(totalTimeSpent);

   totalMinsSpentND
      .formatNumber(d3.format(""))
      .valueAccessor(function (d) {
            return d % 60;
       })
       .group(totalTimeSpent);




    timeChart_TimeSpent
       .width(630)
       .height(150)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(totalTimeSpentByMonth)
       .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .elasticX(true)
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .centerBar(true)
        .gap(1)
        .yAxis().ticks(4);



   nameChart
       .width(650)
       .height(300)
       .dimension(nameDim)
       .group(totalTimeSpentByName)
       .elasticX(true)
       .ordinalColors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
       .gap(6);



   monthChart
       .width(300)
       .height(300)
       .dimension(monthDim)
       .group(MISByMonth)
       .xAxis().ticks(4);

    /*
   categoryChart
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(categoryDim)
       .group(MISByCategory);
*/
    categoryChart
       .height(190)
       .radius(80)
       .innerRadius(20)
       .legend(dc.legend().x(10).y(10).itemHeight(13).gap(5))
       .minAngleForLabel(0.6)
       .transitionDuration(1500)
       .turnOnControls(true)
       .dimension(categoryDim)
       .renderLabel(true)
       .group(totalTimeSpentByCategory);

   dc.renderAll();
}