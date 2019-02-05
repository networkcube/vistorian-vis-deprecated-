///-----------------------------------------------------------------------------------------------------------------
/// clustering.ts.  Copyright (c) 2014 Microsoft Corporation.
///     - clustering related code for LinkWave.
///-----------------------------------------------------------------------------------------------------------------

// <reference path="features.ts"/>

import * as f from './features';

declare var numeric: any;

export class Clustering {
    // K-means clustering
    static Kmeans(data: number[][], clusterNum: number, numIteration: number) {
        var clusters: any[] = [];
        var clusterPerLink: any[] = []; // # links
        var linksPerCluster: any[] = []; // # clusters

        // iterate until clusters become stable (i.e. there is no sample changing clusters) or reach the prefixed max iteration number
        for (var nIter = 0; nIter < numIteration; nIter++) {

            // update clusters
            for (var i = 0; i < clusterNum; i++) {
                if (nIter == 0) {
                    // initialize the clusters
                    clusters[i] = data[i];
                } else {
                    clusters[i] = Clustering.Kmeans_computeMean(data, linksPerCluster[i])
                }
                linksPerCluster[i] = [];
            }

            // iterate for all links
            var numClusterChanges: number = 0;
            for (var j = 0; j < data.length; j++) {
                var minSimilarity: number = 1000000;
                var closestCluster: any = null;

                if (nIter == 0)
                    clusterPerLink[j] = clusterNum + 1; // initialize

                // iterate for all clusters (i.e. one link vs. all clusters)
                for (var cIter = 0; cIter < clusterNum; cIter++) {
                    var similarity: number = f.Features.libDistEuc(data[j], clusters[cIter]);
                    if (minSimilarity > similarity) {
                        closestCluster = cIter;
                        minSimilarity = similarity;
                    }
                }

                // count the cluster changings
                if (clusterPerLink[j] != closestCluster)
                    numClusterChanges = numClusterChanges + 1;

                clusterPerLink[j] = closestCluster; // # links
                if (closestCluster != null) {
                    var numSamples = linksPerCluster[closestCluster].length;
                    linksPerCluster[closestCluster][numSamples] = j;
                }
            }

            if (numClusterChanges == 0)
                break;
        }
        return linksPerCluster;
    }

    static Kmeans_computeMean(data: any, sampleIdx: number[]) {
        // compute and return a new cluster center
        var clusterMeans: any[] = [];

        // compute mean for each class
        var numSamples: number = sampleIdx.length;

        var accumulatedData: any[] = [];
        for (var i = 0; i < numSamples; i++) {
            var idx: number = sampleIdx[i];
            if (i == 0) {
                accumulatedData = data[idx];
            }
            else {
                accumulatedData = f.Features.libVecPlusMinus(accumulatedData, data[idx], "plus");
            }
        }

        // take mean
        for (var j = 0; j < accumulatedData.length; j++) {
            if (accumulatedData[j] != 0)
                accumulatedData[j] = accumulatedData[j] / numSamples;
        }
        return accumulatedData;
    }

    static ascendSort(a: any, b: any) {
        return a.value - b.value;
    }

    // spectral clustering
    static SC_main(data: any, clusterNum: number, kNN: number, SCtype: string) {
        console.log("spectral clustering");

        // construct an affinity matrix, kNN connected SC'[''
        var A: any[] = []; // affinity matrix
        var D: any[] = []; // diagonal matrix
        for (var i = 0; i < data.length; i++) {
            var refCorr: any = data[i];
            var dist: any[] = [];
            A[i] = [];
            D[i] = [];

            for (var j = 0; j < data.length; j++) {
                var targetCorr: any = data[j];
                var distVal: number = f.Features.libDistEuc(refCorr, targetCorr);
                dist.push({ id: j, value: distVal });
                A[i][j] = 0;
                D[i][j] = 0;
            }

            dist = dist.sort(this.ascendSort);
            for (var p = 0; p < kNN; p++) {
                if (SCtype == "real") {
                    A[i][dist[p].id] = dist[p].value;
                } else if (SCtype == "binary") {
                    A[i][dist[p].id] = 1;
                }
            }
        }

        // compute the laplacian matrix
        // L_norm = D^(-1/2)*(D-A)*D^(-1/2)
        for (var m = 0; m < data.length; m++) {
            var sum: number = 0;
            for (var n = 0; n < data.length; n++) {
                sum = sum + A[m][n];
            }
            D[m][m] = Math.pow(sum, (-1 / 2));
        }

        var DminusA: any[] = f.Features.libMatPlusMinus(D, A, "minus");
        var DDminusA: any = numeric.dot(D, DminusA);
        var L_norm: any = numeric.dot(DDminusA, D);


        // compute eigen vectors
        var eigenVecVal: any = numeric.eig(L_norm); // eigenvectors are sorted in descending order of eigenvalues
        var eigenVals: any[] = [];
        for (var q = 0; q < L_norm.length; q++) {
            eigenVals.push({ id: q, value: eigenVecVal.lambda.x[q] });
        }
        eigenVals = eigenVals.sort(this.ascendSort);

        // compute normalized U matrix
        var U: any[] = [];
        for (var n = 1; n < clusterNum + 1; n++) {
            var eigVecTemp: any = eigenVecVal.E.x[eigenVals[n].id];
            var normVal: any = numeric.norm2(eigVecTemp);
            for (var kk = 0; kk < eigVecTemp.length; kk++) {
                eigVecTemp[kk] = eigVecTemp[kk] / normVal;
            }
            U[n - 1] = eigVecTemp;
        }

        return numeric.transpose(U);
    }

    // compute silhouette coefficient to determin the optimal number of clusters
    static silhouetteMeasure(data: number[][], linksPerCluster: number[][]) {
        var clusterNum: number = linksPerCluster.length;

        var coefficient: number = 0;
        var totalCount: number = 0;
        // loop for each clusters
        for (var i = 0; i < clusterNum; i++) {
            var samPerCluster: number[] = linksPerCluster[i];
            var samNum: number = samPerCluster.length;
            totalCount = totalCount + samNum;

            // loop for each samples per cluster
            for (var j = 0; j < samNum; j++) {
                var samIdx1: number = samPerCluster[j];

                // compute the average a(i), within cluster
                var withinCluster: number = 0;
                for (var k = 0; k < samNum; k++) { // loop for each comparison within a cluster
                    var samIdx2: number = samPerCluster[k];

                    withinCluster = withinCluster + f.Features.libDistEuc(data[samIdx1], data[samIdx2]);
                }
                withinCluster = withinCluster / samNum;

                // compute the average b(i), between clusters
                var betweenClusters: any[] = [];
                for (var c = 0; c < clusterNum; c++) {
                    if (c == i) {
                        betweenClusters[c] = 1000;
                        continue; // skip the identical cluster
                    }

                    var samPerClusterSub: number[] = linksPerCluster[c];
                    var samNumSub: number = samPerClusterSub.length;
                    var betweenCluster: number = 0;
                    for (var d = 0; d < samNumSub; d++) {
                        var samIdx3: number = samPerClusterSub[d];
                        betweenCluster = betweenCluster + f.Features.libDistEuc(data[samIdx1], data[samIdx3]);
                    }
                    betweenClusters[c] = betweenCluster / samNumSub;
                }

                // find the min val
                var minBtwCluster: number = 100;
                for (var m = 0; m < betweenClusters.length; m++) {
                    if (minBtwCluster > betweenClusters[m]) {
                        minBtwCluster = betweenClusters[m];
                    }
                }

                // compute silhouette coefficient
                if (withinCluster > minBtwCluster) {
                    coefficient = coefficient + ((minBtwCluster / withinCluster) - 1);
                } else if (withinCluster < minBtwCluster) {
                    coefficient = coefficient + (1 - (withinCluster / minBtwCluster));
                }
            }
        }
        coefficient = coefficient / totalCount;

        return coefficient;
    }
}
