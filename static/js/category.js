/**
 * Created by Maria on 30/06/2016.
 */


queue()
   .defer(d3.json, "/MIS/categoryMonth")
   .defer(d3.json, "/MIS/dealDataMonth")
   .await(makeGraphs);

function makeGraphs(error, categoryDataJson, dealDataJson) {

   //Clean dataJson data
   var teamData = categoryDataJson;
   var dealData = dealDataJson;

   //Create two Crossfilter instances
   var ndx = crossfilter(teamData);
   var ndx2 = crossfilter(dealData);

   //Define Dimension ndx

   var monthDim = ndx.dimension(function(d){
        return d["month_name"];
   }) ;
    
   var categoryDim = ndx.dimension(function (d) {
       return d["category_name"];
   });
    
   var teamDim = ndx.dimension(function (d) {
       return d["team_name"];
   });

   //Define Dimensions ndx2
   var dealDim = ndx2.dimension(function (d) {
       return d["model_name"];
   });
   var categoryDim2 = ndx2.dimension(function (d) {
       return d["category_name"];
   });
   var teamDim2 = ndx2.dimension(function (d) {
       return d["team_name"];
   });

   //Calculate metrics ndx
    var MISByCategory = categoryDim.group();
    var MISByTeam = teamDim.group();

    var totalTimeSpentByMonth= monthDim.group().reduceSum(function (d){
       return d["time_spent"];
    });

    var totalTimeSpentByCategory = categoryDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    var totalTimeSpentByTeam = teamDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    var all = ndx.groupAll();
    var totalTimeSpent = all.reduceSum(function (d) {
        return d["time_spent"];
    });

    //Define metrics ndx2
    var MISByCategory2 = categoryDim2.group();
    var MISByTeam2 = teamDim2.group();
    var MISByDeal2 = dealDim.group();
    var totalTimeSpentByDeal = dealDim.group().reduceSum(function (d){
        //return d["Total_Time"];
        //this is in DAYS
        return (d["Total_Time"] / 60)/7.5;
    });
    var all2 = ndx2.groupAll();
    var totalTimeSpent2 = all2.reduceSum(function (d) {
        return d["Total_Time"];
    });

    //Charts ndx
   var totalTimeSpentND = dc.numberDisplay("#total-time-spent-nd");
   var totalHoursSpentND = dc.numberDisplay("#total-hours-spent-nd");
   var totalMinsSpentND = dc.numberDisplay("#total-mins-spent-nd");
   var totalDaysSpentND = dc.numberDisplay("#total-days-spent-nd");

   categoryChart = dc.pieChart("#category-chart"); //by removing the var here the reset button on the page will work

    //Charts ndx2
   dealChart = dc.rowChart("#deal-chart");
    //Define values (to be used in charts)
   var totalHoursSpentND2 = dc.numberDisplay("#total-hours-spent-nd2");
   var totalMinsSpentND2 = dc.numberDisplay("#total-mins-spent-nd2");
   var totalDaysSpentND2 = dc.numberDisplay("#total-days-spent-nd2");

    //Select menus ndx
    selectField = dc.selectMenu('#menu-select')
        .dimension(teamDim)
        .group(MISByTeam)
       .title(function(d){
           return d.key;
       });

    //Select menus ndx2

    selectField2 = dc.selectMenu('#menu-select-team2')
        .dimension(teamDim2)
        .group(MISByTeam2)
       .title(function(d){
           return d.key;
       });

   //charts ndx

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
    
   totalMinsSpentND
      .formatNumber(d3.format(""))
      .valueAccessor(function (d) {
            return d % 60;
       })
       .group(totalTimeSpent);

    totalDaysSpentND
      .formatNumber(d3.format(","))
      .valueAccessor(function (d) {
            //return (Math.floor(d/60))/7.5;
            return Math.round((d/60)/7.5);
       })
       .group(totalTimeSpent);


   categoryChart
       .height(220)
       .radius(90)
       .innerRadius(30)
       .legend(dc.legend().x(20).y(20).itemHeight(13).gap(5))
       .minAngleForLabel(0.6)
       .transitionDuration(1500)
       .turnOnControls(true)
       .dimension(categoryDim)
       .renderLabel(true)
       .group(totalTimeSpentByCategory);

   //charts ndx2
    dealChart
       .width(450)
       .height(250)
       .dimension(dealDim)
       .group(totalTimeSpentByDeal)
       .elasticX(true)
       .gap(5);

   totalHoursSpentND2
      .formatNumber(d3.format(","))
      .valueAccessor(function (d) {
            return Math.floor(d/60);
       })
       .group(totalTimeSpent2);

   totalMinsSpentND2
      .formatNumber(d3.format(""))
      .valueAccessor(function (d) {
            return d % 60;
       })
       .group(totalTimeSpent2);

    totalDaysSpentND2
      .formatNumber(d3.format(","))
      .valueAccessor(function (d) {
            //return (Math.floor(d/60))/7.5;
            return Math.round((d/60)/7.5);
       })
       .group(totalTimeSpent2);

   dc.renderAll();
}