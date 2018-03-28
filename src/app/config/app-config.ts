// NOTE: This code is following advice/code in https://gist.github.com/fernandohu/122e88c3bcd210bbe41c608c36306db9 to load
// configuration data before application startup in Angular 2; such config data will be held in AppConfig's config variable.
import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class AppConfig {

    private config: Object = null;
    private env:    Object = null;

    constructor(private http: Http) {

    }

    /**
     * Use to get the data found in the second file (config file)
     */
    public getConfig(key: any) {
        return this.config[key];
    }

    // Convenience function: get earliest video year; assumes this.config set already via load().
    public getEarliestInterviewYear() : number {
        var testObj: Object = this.config["firstInterviewYear"];
        var MIN_YEAR_ALLOWED: number = 1900; // default to something reasonable in case configuration data is corrupt
        var candidateYear: number;
        if (testObj != null) {
            candidateYear = +testObj.toString();
            if (candidateYear < MIN_YEAR_ALLOWED)
                candidateYear = MIN_YEAR_ALLOWED; // NOTE: lots of bad data possibilities still allowed here....
        }
        else
            candidateYear = MIN_YEAR_ALLOWED;
        return candidateYear;
    }

    /**
     * Use to get the data found in the first file (env file)
     */
    public getEnv(key: any) {
        return this.env[key];
    }

    /**
     * This method:
     *   a) Loads "env.json" to get the current working environment (e.g.: 'production', 'development')
     *   b) Loads "config.[env].json" to get all env's variables (e.g.: 'config.development.json')
     */
    public load() {
        return new Promise((resolve, reject) => {
            this.http.get('assets/env.json').map( res => res.json() ).catch((error: any):any => {
                console.log('Configuration file "assets/env.json" could not be read');
                resolve(true);
                return ('Server error'); // could be more detailed as needed, e.g.,  Observable.throw(error.json().error || 'Server error' with an up-front check that error has valid JSON
            }).subscribe( (envResponse) => {

                this.env = envResponse;
                let request:any = null;

                switch (this.getEnv('myEnv')) {
                    case 'production': {
                        request = this.http.get('assets/config.production.json');
                    } break;

                    case 'development': {
                        request = this.http.get('assets/config.development.json');
                    } break;

                    case 'default': {
                        console.error('Environment file is not set or invalid');
                        resolve(true);
                    } break;
                }

                if (request) {
                    request
                        .map( res => res.json() )
                        .catch((error: any) => {
                            console.error('Error reading ' + envResponse.env + ' configuration file');
                            resolve(error);
                            return Observable.throw(error.json().error || 'Server error');
                        })
                        .subscribe((responseData) => {
                            this.config = responseData;
                            resolve(true);
                        });
                } else {
                    console.error('Env config file "env.json" is not valid');
                    resolve(true);
                }
            });

        });
    }
}
