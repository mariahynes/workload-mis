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

    var totalTimeSpentByMonth= dateDim.group().reduceSum(function (d){
       return d["time_spent"];
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
        return d["time_spent"];
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

   //Charts
   var timeChart = dc.barChart("#time-chart");
   var monthChart = dc.rowChart("#month-chart");
   var nameChart = dc.rowChart("#name-row-chart");
   var totalTimeSpentND = dc.numberDisplay("#total-time-spent-nd");
   var categoryChart = dc.pieChart("#category-chart");
   var totalItemsLoggedND = dc.numberDisplay("#total-items-logged-nd");

   selectField = dc.selectMenu('#menu-select')
        .dimension(monthDim)
        .group(MISByMonth)
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
   .title(function(d){
       return d.key;
   });

    selectField4 = dc.selectMenu('#menu-select4')
    .dimension(modelNameDim)
    .group(MISByModelName)
   .title(function(d){
       return d.key;
   });

   selectField5 = dc.selectMenu('#menu-select5')
    .dimension(functionDim)
    .group(MISByFunction)
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



        var totes_mins = totalTimeSpentND.group().value();
        var hours = Math.floor(totes_mins/60);
        var mins = totes_mins % 60;
        $("#total-time-spent-txt").html(totes_mins + " minutes: " + hours + " hrs " + mins + " mins");
        

   timeChart
       .width(700)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(MISByDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))
       .elasticY(true)
       .elasticX(true)
       .xAxisLabel("Month")
       .yAxis().ticks(4);

   nameChart
       .width(800)
       .height(600)
       .dimension(nameDim)
       .group(MISByName)
       .xAxis().ticks(25);

   monthChart
       .width(300)
       .height(300)
       .dimension(monthDim)
       .group(MISByMonth)
       .xAxis().ticks(4);

   categoryChart
       .height(220)
       .radius(90)
       .innerRadius(40)
       .transitionDuration(1500)
       .dimension(categoryDim)
       .group(MISByCategory);

   dc.renderAll();
}