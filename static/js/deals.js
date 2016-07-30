/**
 * Created by Maria on 30/06/2016.
 */


queue()
   .defer(d3.json, "/MIS/dealData")
   .await(makeGraphs);

function makeGraphs(error, dealDataJson) {

   //Clean dataJson data
   var dealData = dealDataJson;

    dealData.forEach(function (d) {

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



   //Create Crossfilter instance
   var ndx = crossfilter(dealData);

   //Define Dimension

   var categoryDim = ndx.dimension(function (d) {
       return d["category_name"];
   });

   var dealDim = ndx.dimension(function (d) {
       return d["model_name"];
   });
   var categoryDim2 = ndx.dimension(function (d) {
       return d["category_name"];
   });
   var teamDim2 = ndx.dimension(function (d) {
       return d["team_name"];
   });

    var monthDim = ndx.dimension(function(d){
       return d["month_name"];
    });

    var totalTimeSpentByCategory = categoryDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    //Define metrics ndx
    var MISByCategory2 = categoryDim2.group();
    var MISByTeam2 = teamDim2.group();
    var MISByDeal2 = dealDim.group();
    var MISByMonth = monthDim.group();
    var totalTimeSpentByDeal = dealDim.group().reduceSum(function (d){
        //this is in DAYS
        return (d["time_spent"] / 60)/7.5;
        //return d["time_spent"];
    });
    var all2 = ndx.groupAll();
    var totalTimeSpent2 = all2.reduceSum(function (d) {
        return d["time_spent"];
    });

   categoryChart = dc.pieChart("#category-chart"); //by removing the var here the reset button on the page will work

    //Charts ndx
   dealChart = dc.rowChart("#deal-chart");
    //Define values (to be used in charts)
   var totalHoursSpentND2 = dc.numberDisplay("#total-hours-spent-nd2");
   var totalMinsSpentND2 = dc.numberDisplay("#total-mins-spent-nd2");
   var totalDaysSpentND2 = dc.numberDisplay("#total-days-spent-nd2");

    //Select menus ndx

    selectField1 = dc.selectMenu('#menu-select-month')
        .dimension(monthDim)
        .group(MISByMonth)
        .theSize(13)
       .title(function(d){
           return d.key.split(".")[1];
       });

    selectField2 = dc.selectMenu('#menu-select-team2')
        .dimension(teamDim2)
        .group(MISByTeam2)
       .title(function(d){
           return d.key;
       });



   categoryChart
       .height(280)
       .radius(50)
       .innerRadius(10)
       .legend(dc.legend().x(10).y(10).itemHeight(13).gap(5))
       .minAngleForLabel(0.6)
       .transitionDuration(1500)
       .turnOnControls(true)
       .dimension(categoryDim)
       .renderLabel(false)
       .group(totalTimeSpentByCategory);

   //charts ndx
    dealChart
       .width(450)
       .height(2850)
       .dimension(dealDim)
       .group(totalTimeSpentByDeal)
       .elasticX(true)
       .gap(1);

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