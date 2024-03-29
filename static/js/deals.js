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
   categoryChart_xs = dc.pieChart("#category-chart_xs"); //by removing the var here the reset button on the page will work

    //Charts ndx
   dealChart = dc.rowChart("#deal-chart");
   dealChart_xs = dc.rowChart("#deal-chart_xs");

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
       .width(135)
       .height(280)
       .radius(50)
       .innerRadius(10)
       .legend(dc.legend().x(5).y(5).itemHeight(13).gap(5))
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489'])
       .minAngleForLabel(0.6)
       .transitionDuration(1500)
       .turnOnControls(true)
       .dimension(categoryDim)
       .renderLabel(false)
       .group(totalTimeSpentByCategory);

    categoryChart_xs
       .width(250)
       .height(280)
       .radius(90)
       .innerRadius(30)
       .legend(dc.legend().x(2).y(2).itemHeight(10).gap(2))
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489'])
       .minAngleForLabel(0.8)
       .transitionDuration(1500)
       .turnOnControls(true)
       .dimension(categoryDim)
       .renderLabel(true)
       .group(totalTimeSpentByCategory);

   //charts ndx
    dealChart
       .width(450)
       .height(2850)
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489','#ffa388','#a9bcca','#fb9a1d','#e588a3','#14ac00'])
       .dimension(dealDim)
       .group(totalTimeSpentByDeal)
       .elasticX(true)
       .gap(1);

    dealChart_xs
       .width(280)
       .height(2850)
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489','#ffa388','#a9bcca','#fb9a1d','#e588a3','#14ac00'])
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