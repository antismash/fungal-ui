'use strict'

angular.module('antismash.ui.bacterial.as_start', ['ngFileUpload'])
    .controller('AsStartCtrl', ['$state', '$window', 'Upload',
        function ($state, $window, Upload) {
            var vm = this;

            vm.valid_endings = '.gbk,.gb,.gbff,.emb,.embl,.fa,.fasta,.fna';
            vm.valid_gff_endings = '.gff,.gff3';

            vm.run_beta = false;

            vm.upload_sideload_file = false;

            // Defaullt values
            vm.submission = {
            };
            vm.extra_features = [
                { id: 'knownclusterblast', description: 'KnownClusterBlast', default: true, stable: true, beta: true },
                { id: 'clusterblast', description: 'ClusterBlast', default: false, stable: true, beta: true },
                { id: 'subclusterblast', description: 'SubClusterBlast', default: true, stable: true, beta: true },
                { id: 'cc_mibig', description: 'MIBiG cluster comparison', default: false, stable: true, beta: true },
                { id: 'asf', description: 'ActiveSiteFinder', default: true, stable: true, beta: true },
                { id: 'rre', description: 'RREFinder', default: true, stable: true, beta: true },
                { id: 'clusterhmmer', description: 'Cluster Pfam analysis', default: false, stable: true, beta: true },
                { id: 'pfam2go', description: 'Pfam-based GO term annotation', default: false, stable: true, beta: true },
                { id: 'tigrfam', description: 'TIGRFam analysis', default: false, stable: true, beta: true },
                { id: 'cassis', description: 'Cluster-border prediction based on transcription factor binding sites (CASSIS)', default: false, stable: true, beta: true },
            ];

            for (var i = 0; i < vm.extra_features.length; i++) {
                var feature = vm.extra_features[i];
                vm.submission[feature.id] = feature.default;
            }

            vm.strictness_levels = [
                { id: 'strict', description: 'Detects well-defined clusters containing all required parts.' },
                { id: 'relaxed', description: 'Detects partial clusters missing one or more functional parts.' },
                { id: 'loose', description: 'Detects poorly-defined clusters and clusters that likely match primary metabolites.',
                  warning: 'Likely to cause false positives.' },
            ];
            vm.hmmdetection_strictness = 1;

            vm.submit = function (form) {
                vm.submission.jobtype = 'antismash6';
                vm.active_submission = true;
                vm.errror_message = null;

                vm.submission.genefinder = 'none';

                if (vm.upload_file) {
                    vm.submission.seq = vm.file;
                    if (vm.gff_file) {
                        vm.submission.gff3 = vm.gff_file;
                        vm.submission.genefinder = 'none';
                    }
                    else {
                        if (vm.isFastaFile(vm.file.name)) {
                            vm.submission.genefinder = "glimmerhmm";
                        }
                    }
                } else {
                    vm.submission.ncbi = vm.ncbi;
                    vm.submission.genefinder = 'none';
                }

                if (vm.run_beta && vm.sideload_file) {
                    vm.submission.sideload = vm.sideload_file;
                }

                if (vm.email) {
                    vm.submission.email = vm.email;
                }

                for (var i = 0; i < vm.extra_features.length; i++) {
                    var feature = vm.extra_features[i];
                    if (vm.run_beta && !feature.beta) {
                        delete vm.submission[feature.id];
                    }
                    if (!vm.run_beta && !feature.stable) {
                        delete vm.submission[feature.id];
                    }
                }

                vm.submission.hmmdetection_strictness = vm.strictness_levels[vm.hmmdetection_strictness].id;

                Upload.upload({
                    url: '/api/v1.0/submit',
                    data: vm.submission,
                }).then(function (resp) {
                    vm.active_submission = false;
                    $state.go('show.job', { id: resp.data.id });
                }, function (resp) {
                    vm.active_submission = false;
                    var full_message = "Job submission failed.";
                    if (resp.data.message) {
                        full_message += " The error message was: " + resp.data.message;
                    }
                    vm.error_message = full_message;
                    console.log(resp);
                }, function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    if (!evt.config.data.seq) {
                        return;
                    }
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.data.seq.name);
                });
            }

            vm.isFastaFile = function (filename) {
                const FASTA_ENDINGS = ['.fa', '.fna', '.fasta'];

                // IE can't do endsWith()
                if (!String.prototype.endsWith) {
                    String.prototype.endsWith = function (search_string, position) {
                        var subject = this.toString();
                        if (typeof position !== 'number' || !isFinite(postion) || Math.floor(postion) !== postion || postion > subject.length) {
                            postion = subject.length;
                        }
                        position -= search_string.length;
                        var last_index = filename.lastIndexOf(search_string);
                        return last_index !== -1 && last_index === position;
                    }
                }

                for (var i in FASTA_ENDINGS) {
                    var ending = FASTA_ENDINGS[i];
                    if (filename.toLowerCase().endsWith(ending)) {
                        return true;
                    }
                }
                return false;
            }

            vm.showGffInput = function () {
                if (!vm.upload_file) {
                    return false;
                }

                if (!vm.file || !vm.file.name) {
                    return false;
                }

                return vm.isFastaFile(vm.file.name);
            }


            vm.validJob = function () {
                if (vm.upload_file) {
                    if (!vm.file) {
                        return false;
                    }
                } else {
                    if (!vm.ncbi) {
                        return false;
                    }
                }
                return true;
            }

            vm.allOff = function () {
                for (var i = 0; i < vm.extra_features.length; i++) {
                    var feature = vm.extra_features[i];
                    vm.submission[feature.id] = false;
                }
            }

            vm.allOn = function () {
                for (var i = 0; i < vm.extra_features.length; i++) {
                    var feature = vm.extra_features[i];
                    if (!feature.disabled) {
                        vm.submission[feature.id] = true;
                    }
                }
            }

            vm.loadSampleInput = function () {
                vm.upload_file = false;
                vm.ncbi = "NC_007194";
            }

            vm.openSampleOutput = function () {
                $window.open("/upload/fungal-example/index.html", "_blank");
            }

            vm.loadJob = function () {
                console.log(vm.job_id);
                if (vm.job_id.substr(0, 8).toLowerCase() == 'bacteria') {
                    $window.location.href = "http://antismash.secondarymetabolites.org/#!/show/job/" + vm.job_id;
                }
                else if (vm.job_id.substr(0, 5).toLowerCase() == 'fungi') {
                    $state.go('show.job', { id: vm.job_id });
                }
                else if (vm.job_id.substr(0, 6).toLowerCase() == 'plants') {
                    $window.location.href = "http://plantismash.secondarymetabolites.org/#!/show/job/" + vm.job_id;
                }
            }

            vm.strictness_descriptions = function () {
                var descriptions = [];
                for (var i = 0; i <= vm.hmmdetection_strictness; i++) {
                    descriptions.push(vm.strictness_levels[i].description);
                }
                return descriptions;
            };

            vm.filterFeatureByStatus = function (value) {
                if (value.beta && vm.run_beta) {
                    return true;
                }
                if (value.stable && !vm.run_beta) {
                    return true;
                }
                return false;
            }

        }]);
