/**
 * Created by Maria on 30/06/2016.
 */


queue()
   .defer(d3.json, "/MIS/peopleData")
   .await(makeGraphs);

function makeGraphs(error, peopleDataJson) {

   //Clean dataJson data
   var peopleData = peopleDataJson;

    var dateFormat = d3.time.format("%d %B %Y");
    peopleData.forEach(function (d) {

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

   //Create Crossfilter instance
   var ndx = crossfilter(peopleData);

   //Define Dimension

   var categoryDim = ndx.dimension(function (d) {
       return d["category_name"];
   });

   var peopleDim = ndx.dimension(function (d) {
       return d["user_name"];
   });

   var teamDim = ndx.dimension(function (d) {
       return d["team_name"];
   });

   var monthDim = ndx.dimension(function(d){
       return d["month_name"];
   });

    var totalTimeSpentByCategory = categoryDim.group().reduceSum(function (d){
        return d["time_spent"];
    });

    //Define metrics ndx
    var MISByTeam = teamDim.group();
    var MISByMonth = monthDim.group();

    var totalTimeSpentByPerson = peopleDim.group().reduceSum(function (d){
        //this is in DAYS
        return (d["time_spent"] / 60)/7.5;
    });

    var all = ndx.groupAll();
    var totalTimeSpent = all.reduceSum(function (d) {
        return d["time_spent"];
    });

   categoryChart = dc.pieChart("#category-chart"); //by removing the var here the reset button on the page will work
   categoryChart_xs = dc.pieChart("#category-chart_xs"); //by removing the var here the reset button on the page will work

    //Charts ndx
   peopleChart = dc.rowChart("#people-chart");
   peopleChart_xs = dc.rowChart("#people-chart_xs");

    //Define values (to be used in charts)
   var totalHoursSpentND = dc.numberDisplay("#total-hours-spent-nd");
   var totalMinsSpentND = dc.numberDisplay("#total-mins-spent-nd");
   var totalDaysSpentND = dc.numberDisplay("#total-days-spent-nd");
   var totalMinsND = dc.numberDisplay("#total-Mins-ND");
    //Select menus ndx

    selectField = dc.selectMenu('#menu-select-team')
        .dimension(teamDim)
        .group(MISByTeam)
       .title(function(d){
           return d.key;
       });

    selectField2 = dc.selectMenu('#menu-select-month')
        .dimension(monthDim)
        .group(MISByMonth)
        .theSize(13)
       .title(function(d){
           return d.key.split(".")[1];
       });



   categoryChart
       .width(150)
       .height(280)
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489'])
       .radius(50)
       .innerRadius(10)
       .legend(dc.legend().x(2).y(2).itemHeight(13).gap(5))
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
    peopleChart
       .width(450)
       .height(400)
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489','#ffa388','#a9bcca','#fb9a1d','#e588a3','#14ac00'])
       .dimension(peopleDim)
       .group(totalTimeSpentByPerson)
       .elasticX(true)
       .gap(10);

    peopleChart_xs
       .width(280)
       .height(400)
       .ordinalColors(['#0096aa','#e8cc86','#e5bcc0','#9fd175','#cf8489','#ffa388','#a9bcca','#fb9a1d','#e588a3','#14ac00'])
       .dimension(peopleDim)
       .group(totalTimeSpentByPerson)
       .elasticX(true)
       .gap(10);

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

    totalMinsND
      .formatNumber(d3.format(""))
      .valueAccessor(function (d) {
            return d;
       })
       .group(totalTimeSpent);

    totalDaysSpentND
      .formatNumber(d3.format(""))
      .valueAccessor(function (d) {
            //return (Math.floor(d/60))/7.5;
            return Math.round((d/60)/7.5);
       })
       .group(totalTimeSpent);

   dc.renderAll();
}